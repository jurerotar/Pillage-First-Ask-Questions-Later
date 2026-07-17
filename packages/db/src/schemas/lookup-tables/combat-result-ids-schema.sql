CREATE TABLE combat_result_ids
(
    id INTEGER PRIMARY KEY,
    combat_result TEXT NOT NULL UNIQUE CHECK (combat_result IN (
        'ATTACKER_NO_LOSS',
        'ATTACKER_SOME_LOSS',
        'ATTACKER_FULL_LOSS',
        'DEFENDER_NO_LOSS',
        'DEFENDER_SOME_LOSS',
        'DEFENDER_FULL_LOSS'
    ))
) STRICT;
