-- Fix duplicate organizations keeping the first one created
DELETE FROM organizations 
WHERE id NOT IN (
 SELECT id FROM organizations 
 WHERE (name, created_at) IN (
   SELECT name, MIN(created_at) 
   FROM organizations 
   GROUP BY name
 )
);