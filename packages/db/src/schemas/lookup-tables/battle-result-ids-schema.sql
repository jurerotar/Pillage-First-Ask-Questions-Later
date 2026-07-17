CREATE TABLE battle_result_ids
(
    id INTEGER PRIMARY KEY,
    battle_result TEXT NOT NULL UNIQUE CHECK (battle_result IN (
        'attackerNoLoss',
        'attackerSomeLoss',
        'attackerFullLoss',
        'defenderNoLoss',
        'defenderSomeLoss',
        'defenderFullLoss'
    ))
) STRICT;
