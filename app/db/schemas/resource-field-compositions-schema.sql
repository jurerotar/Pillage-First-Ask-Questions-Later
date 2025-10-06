CREATE TABLE resource_field_compositions
(
  id INTEGER PRIMARY KEY,
  resource_field_composition TEXT NOT NULL CHECK (resource_field_composition IN ('4446', '5436', '5346', '4536', '3546', '4356', '3456', '4437', '4347', '3447', '3339', '11115', '00018'))
) STRICT;
