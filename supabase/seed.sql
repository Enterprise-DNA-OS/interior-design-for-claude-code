insert into projects(id,name,client,currency,budget,install_date,privacy_review) values
('10000000-0000-0000-0000-000000000001','Harbour House','Mia Chen','NZD',18000,current_date+21,current_date-120),
('10000000-0000-0000-0000-000000000002','Fitzroy Studio','Oliver Smith','AUD',12000,current_date+35,current_date)
on conflict do nothing;
insert into suppliers(id,name,email) values
('20000000-0000-0000-0000-000000000001','Kauri Furniture','orders@example.test'),
('20000000-0000-0000-0000-000000000002','South Light','sales@example.test') on conflict do nothing;
insert into selections(id,project_id,supplier_id,name,room,sku,specification,quantity,unit_cost,unit_price,lead_days,required_date) values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Oak dining chair','Dining','OC-01','Solid oak, natural finish, 450mm seat',6,240,360,28,current_date+14),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Pendant','Kitchen','P-01','Brass, 300mm diameter, warm white',3,450,620,21,current_date+7),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Pendant','Reception','P-02','',2,450,420,14,current_date+30),
('30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Linen sofa','Living','LS-01','Oatmeal linen, 2200mm wide',1,2800,4100,60,current_date+21)
on conflict do nothing;
insert into approvals(id,selection_id,revision,decision,actor,evidence) values
('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',1,'approved','Mia Chen','Demo approval record A1'),
('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000004',1,'approved','Mia Chen','Demo approval record A2') on conflict do nothing;
insert into orders(id,selection_id,reference,expected_date,received_quantity,received_date,condition_note) values
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','DEMO-PO-01',current_date-3,1,current_date-1,'One shade scratched'),
('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000004','DEMO-PO-02',current_date+10,0,null,'') on conflict do nothing;
insert into tasks(id,project_id,name,owner,due_date) values ('60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Confirm dining fabric','Ana',current_date-5) on conflict do nothing;
insert into time_entries(id,project_id,person,minutes,rate,note) values ('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Ana',135,150,'Supplier sourcing') on conflict do nothing;
insert into issues(id,selection_id,note) values ('80000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','Shade scratched, replacement requested') on conflict do nothing;
insert into activity(id,project_id,note,created_at) values ('90000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Demo: concept review complete',now()-interval '25 days') on conflict do nothing;
