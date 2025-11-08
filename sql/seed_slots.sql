insert into public.slots (code,width,height,price) values
('A1',1,1,100),
('A2',2,1,200),
('B1',1,2,200),
('B2',2,2,400),
('C1',3,1,300),
('C2',1,3,300),
('D1',3,2,500),
('D2',2,3,500)
on conflict (code) do nothing;