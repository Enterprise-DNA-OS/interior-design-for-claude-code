create table projects (
 id uuid primary key default gen_random_uuid(), name text not null unique, client text not null,
 currency text not null check(currency ~ '^[A-Z]{3}$'), budget numeric(14,2) not null default 0 check(budget>=0),
 install_date date, privacy_review date, status text not null default 'active' check(status in ('active','complete','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table suppliers (
 id uuid primary key default gen_random_uuid(), name text not null unique, email text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table selections (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, supplier_id uuid not null references suppliers,
 source_key text unique, name text not null, room text not null, sku text not null default '', specification text not null default '', image_url text not null default '',
 quantity numeric(12,3) not null check(quantity>0), unit_cost numeric(14,2) not null check(unit_cost>=0), unit_price numeric(14,2) not null check(unit_price>=0),
 lead_days integer not null default 0 check(lead_days>=0), required_date date, revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table approvals (
 id uuid primary key default gen_random_uuid(), selection_id uuid not null references selections, revision integer not null,
 decision text not null check(decision in ('approved','rejected')), actor text not null, evidence text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table orders (
 id uuid primary key default gen_random_uuid(), selection_id uuid not null unique references selections,
 reference text not null unique, ordered_date date not null default current_date, expected_date date not null,
 received_date date, received_quantity numeric(12,3) not null default 0 check(received_quantity>=0),
 condition_note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table tasks (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, name text not null, owner text not null,
 due_date date not null, done boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table time_entries (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, person text not null, minutes integer not null check(minutes>0),
 rate numeric(14,2) not null check(rate>=0), note text not null, work_date date not null default current_date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table issues (
 id uuid primary key default gen_random_uuid(), selection_id uuid not null references selections, note text not null,
 resolution text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references projects, note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['projects','suppliers','selections','approvals','orders','tasks','time_entries','issues','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t); end loop; end $$;
create function selection_revision() returns trigger language plpgsql as $$ begin
 if (new.name,new.specification,new.supplier_id,new.quantity,new.unit_cost,new.unit_price,new.sku,new.room,new.image_url)
 is distinct from (old.name,old.specification,old.supplier_id,old.quantity,old.unit_cost,old.unit_price,old.sku,old.room,old.image_url) then
 if exists(select 1 from orders where selection_id=old.id) then raise exception 'Ordered specifications are frozen; record a separate replacement selection'; end if;
 new.revision=old.revision+1; end if; return new; end $$;
create trigger revise before update on selections for each row execute function selection_revision();
create view schedule as select s.*,p.name project,p.client,p.currency,sp.name supplier,sp.email supplier_email,
 round(s.quantity*s.unit_cost,2) cost,round(s.quantity*s.unit_price,2) price,
 round(s.quantity*(s.unit_price-s.unit_cost),2) margin,
 s.required_date-s.lead_days order_by,
 coalesce((select a.decision from approvals a where a.selection_id=s.id and a.revision=s.revision order by a.created_at desc,a.id desc limit 1),'pending') approval
 from selections s join projects p on p.id=s.project_id join suppliers sp on sp.id=s.supplier_id;
create view procurement as select s.id,s.project_id,s.project,s.room,s.name,s.supplier,s.currency,s.quantity,s.approval,s.order_by,s.required_date,
 o.id order_id,o.reference,o.expected_date,o.received_quantity,o.received_date,
 case when o.id is null then 'not ordered' when o.received_quantity>=s.quantity then 'received' when o.expected_date<current_date then 'overdue' else 'in progress' end status
 from schedule s left join orders o on o.selection_id=s.id;
create view project_totals as select p.id,p.name,p.currency,p.budget,
 coalesce(sum(s.price),0) selections_total,coalesce(sum(s.cost),0) supplier_cost,coalesce(sum(s.margin),0) gross_margin,
 p.budget-coalesce(sum(s.price),0) budget_remaining,
 (select coalesce(sum(t.minutes),0) from time_entries t where t.project_id=p.id) minutes,
 (select coalesce(round(sum(t.minutes*t.rate/60),2),0) from time_entries t where t.project_id=p.id) time_value
 from projects p left join schedule s on s.project_id=p.id group by p.id;
create view attention as
 select id,project_id,project,name,'Approval missing or rejected' reason from schedule where approval<>'approved'
 union all select id,project_id,project,name,'Order deadline passed' from procurement where order_id is null and order_by<current_date
 union all select id,project_id,project,name,'Delivery overdue' from procurement where status='overdue'
 union all select t.id,t.project_id,p.name,t.name,'Task overdue' from tasks t join projects p on p.id=t.project_id where not t.done and due_date<current_date
 union all select i.id,s.project_id,s.project,s.name,'Open product issue' from issues i join schedule s on s.id=i.selection_id where i.resolution is null;
create view compliance_checks as
 select id,project_id,project,name,'SPEC-01' rule,'Missing specification evidence' finding from schedule where specification=''
 union all select o.id,s.project_id,s.project,s.name,'CGA-01','Received goods have no condition note' from orders o join schedule s on s.id=o.selection_id where o.received_quantity>0 and o.condition_note=''
 union all select i.id,s.project_id,s.project,s.name,'CGA-02','Product issue has no recorded remedy' from issues i join schedule s on s.id=i.selection_id where i.resolution is null
 union all select p.id,p.id,p.name,p.client,'IPP5-01','Access and backup review missing or older than 90 days (house interval)' from projects p where privacy_review is null or privacy_review<current_date-90;
create index selections_project on selections(project_id);
create index approvals_selection on approvals(selection_id,revision);
