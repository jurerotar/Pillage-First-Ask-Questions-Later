## Version 0.4.13

#### May 1, 2026

* [Feature] Added `Oasis animal finder` page. Oasis animal finder page allows you to search for all oasis with a
  specific combination of animals present. For each selected animal type, you can set a minimum amount of animals of
  that type that must be present in the oasis, allowing oyu to further narrow down the search. Oasis animal finder is
  accessible through the map page.

## Version 0.4.12

#### Apr 29, 2026

* [Performance] Optimized background event generation. This update speeds up simulating of past events by 4-6x on game
  worlds, inactive by more than 10 days.

## Version 0.4.11

#### Apr 29, 2026

* [Feature] Added the ability to cancel unit improvements.
* [Feature] Added a confirmation modal for cancelling unit improvements.
* [BugFix] Fixed an incorrectly calculated cost for unit improvements.

## Version 0.4.10

#### Apr 25, 2026

fix: building downgrade fixes

* [Feature] Added a table of current ongoing demolishments to "Demolish buildings" tab of Village management.
* [Feature] Added a confirmation modal with details of what will happen, if you confirm downgrading or demolishing
  buildings.
* [BugFix] Building overview & building field tooltip will now properly display "Currently downgrading to level x", if
  building is being downgraded.
* [BugFix] Toast notifications will now properly say "Building was downgraded to level x".

## Version 0.4.9

#### Apr 23, 2026

* [Feature] Added Natars as a possible NPC tribe during game world creation.
* [BugFix] Removed Nature and Spartans from game world overview charts.

## Version 0.4.8

#### Apr 20, 2026

* [BugFix] Fixed a Zod type issue occurring on Hero's Mansion page when NPC players are occupying an oasis in your
  vicinity.

## Version 0.4.7

#### Apr 19, 2026

* [BugFix] Fixed an issue where queuing troops would refund resources.

## Version 0.4.6

#### Apr 18, 2026

* [Feature] "Train `{number}` `{unit_name}`" quests may now be progressed.

## Version 0.4.5

#### Apr 15, 2026

* [Feature] Added stationed troops section to the Rally Point's Troop movements tab. This section displays troops
  currently stationed in your village, both deployable troops and reinforcements.

## Version 0.4.4

#### Apr 13, 2026

* [BugFix] Fixed an issue where a hero unit would get duplicated when being sent on an adventure from a non-home
  village.

## Version 0.4.3

#### Apr 13, 2026

* [Feature] Building benefits tab now show all building effect values.

* [BugFix] Fixed wall building incorrectly showing defense bonus of over 100%.

## Version 0.4.2

#### Apr 12, 2026

* [BugFix] Rename village screen will now correctly show current village's name on village change.

* [BugFix] Map tile tooltips and modals will now correctly show "%" sign next to oasis bonus value.

* [BugFix] Fixed incorrect wheat field label on 0-0-0-15 resource fields.

* [BugFix] Fixed certain frontend caches not being properly invalidated when specific events were triggered.

* [BugFix] Fixed homepage's Discord button not correctly showing current server user count.

* [TechnicalImprovement] Selected filters and toggles (ex. on reports page) will now persist through app refreshes.

* [TechnicalImprovement] Improved error-handling flow when exporting game worlds.

## Version 0.4.1

#### Apr 10, 2026

* [BugFix] Fixed missing spacings between labels and inputs on forms.

## Version 0.4.0

#### Apr 9, 2026

* [Breaking] This version introduces breaking changes

* [Feature] We added the ability to found new villages. You're able to found new villages by selecting an empty tile on
  the map, while having 3 settlers present in you village.

* [Feature] We're getting a new page! **Event log page** will show a list of latest events happening in your kingdom! It
  will show completed **construction/destruction/downgrade events**, **training events**, as well as **unit improvement
  events**, **unit research events** and **new village founding events**. You'll be able to toggle between
  village-specific events or all events. This will allow you to see what was done since you were last online, at a
  glance!

* [Feature] We added new custom-made icons! This time for **cavalry defense** and **infantry defense**.

* [Feature] We added experimental support for transferring game world between devices on the same network. This is done
  using WebRTC technology. To transfer the game world to a new device, both devices must have the app open and be on the
  same network.

* [Feature] We added an initial implementation for village loyalty mechanic. This will be expanded in the future with
  the introduction of combat mechanics.

* [Feature] We added an initial implementation for farm lists. This will be expanded in the future with the introduction
  of combat mechanics.

* [Feature] We reworked how construction cancellation works. Previously, cancelling an ongoing construction refunded a
  flat 80% of the construction cost, regardless of when the construction was canceled. This penalized players who
  initialized construction by mistake. New refund system is based on proportionality of already-completed construction.
  Cancelling immediately or in the first 5% of construction duration will refund 95% of the construction cost. From 5%
  of construction duration forwards, the system will refund resources proportionally, with the minimum amount return of
  40%.

## Version 0.3.17

#### Mar 31, 2026

* [BugFix] Fixed an issue where double-clicking a building field would take you to a non-existing page.

## Version 0.3.16

#### Mar 27, 2026

* [BugFix] Fixed an issue where Smithy unit improvement events were not properly accounted for in other villages.

## Version 0.3.15

#### Mar 19, 2026

* [BugFix] Replaced `withResolvers` with a manual implementation to support older devices.

## Version 0.3.14

#### Mar 19, 2026

* [BugFix] Fixed an issue where navigating to certain pages did not work correctly.

## Version 0.3.13

#### Mar 17, 2026

* [TechnicalImprovement] App will now remember your position when navigating between nested tabs.

## Version 0.3.12

#### Mar 14, 2026

* [TechnicalImprovement] Upgraded our internal graphics library version, which now provides smaller and more efficient
  icons.

## Version 0.3.11

#### Mar 13, 2026

* [BugFix] Fixed a bug where multiple building construction events could have been queued up at once.

## Version 0.3.10

#### Mar 12, 2026

* [BugFix] Added missing residence training queue to Village Overview page.

## Version 0.3.9

#### Mar 11, 2026

* [BugFix] Fixed incorrect building duration value shown on Upgrade Details' Upgrade Duration tab.

## Version 0.3.8

#### Mar 8, 2026

* [TechnicalImprovement] Improved api-worker error detection flow. Users will now be properly notified when an error
  occurs.

## Version 0.3.7

#### Mar 6, 2026

* [BugFix] Added additional validations to prevent app from getting in to incorrect state.

## Version 0.3.6

#### Mar 6, 2026

* [BugFix] Fixed formatting issues with increasing percentage values in building cards.

## Version 0.3.5

#### Mar 6, 2026

* [BugFix] Added additional validations to prevent the app from getting to incorrect state. These fixes should prevent
  users from being able to upgrade units beyond level 20, upgrade buildings beyond their max level and surpass other
  similar limitations.

## Version 0.3.4

#### Mar 5, 2026

* [BugFix] Fixed an issue where resource fields showed an incorrect hourly production.

* [BugFix] Fixed an issue where unit training didn't correctly subtract resources.

## Version 0.3.3

#### Mar 4, 2026

* [BugFix] Fixed an issue where controller parameter type-casting was not working correctly.

## Version 0.3.2

#### Mar 4, 2026

* [BugFix] Fixed an issue upgrading buildings wouldn't complete "upgrade building to level x" quests.

* [BugFix] Fixed an issue where training multiple units at once actually trained X * X amount of units, instead of X.

* [BugFix] Fixed an issue where a Hero would return immediately after completing an adventure.

* [BugFix] Added missing dark mode support on various elements.

## Version 0.3.1

#### Mar 3, 2026

* [Feature] Added dark mode support for both public and in-game pages.

## Version 0.3.0

#### Mar 3, 2026

* [Breaking] This version introduces breaking changes

* [Feature] Added hero adventures! Too long have our heroes sat idly by. No longer! You'll now have an option to send
  hero on adventures to gather loot and experience! <br /> Adventures will take anywhere from 8 to 12 minutes, and are
  scaled with game world speed.<br /> Each adventure will cost your hero some health points; 5 to be exact. This can be
  reduced by wearing damage-reducing gear!<br /> Your hero earns experience each time it completes an adventure. It
  currently receives `10 * (number_of_completed_adventures + 1)` experience per successful adventure!<br /> Your hero
  will receive loot on successfully finishing an adventure. We're currently still missing loot tables, so this is coming
  in a later patch, along with hero inventory interface.<br />

* [Feature] Added the ability to train Chiefs and Settlers.

* [Feature] Added more missing unit icons.

* [Feature] Added custom-made icons for resources.

* [BugFix] Fixed an issue where some occupiable oasis did not have proper resource bonuses and animals generated.

* [BugFix] Fixed an issue where not all occupiable oasis were shown in Hero's Mansion.

* [Performance] Improved database seeding performance and reduced overall size of the database file. We implemented 2
  separate changes in regard to database. First one reduced overall database size by around 10-30% percent, depending
  on game world size. Second one cut the time to seed the database by over 50% on game worlds of all sizes. This results
  in faster game world creation, as well as better performance while in game!

* [TechnicalImprovement] Improved database breaking changes detection. App will now more consistently detect outdated
  game worlds.

## Version 0.2.5

#### Feb 28, 2026

* [Feature] Error messages for resource-dependent actions now display the exact time at which the required resources
  will be available.

## Version 0.2.4

#### Feb 23, 2026

* [Feature] Village overview page now shows ongoing building construction table with the ability to cancel construction

## Version 0.2.3

#### Feb 21, 2026

* [BugFix] Fixed discrepancy between population count shown on the map and in statistics.

## Version 0.2.2

#### Feb 21, 2026

* [BugFix] Fixed building construction queue tooltips overlapping on tables.

## Version 0.2.1

#### Feb 16, 2026

* [Feature] Added an option to view constructable buildings list in compacted form. This change allows players to scroll
  less, especially on mobile devices.

* [Feature] Added the ability to commit minor database upgrades without breaking game worlds.

## Version 0.2.0

#### Feb 15, 2026

* [Breaking] This version introduces breaking changes

* [Feature] Added hero attributes page. You're now able to see all your hero attributes. There are some additional
  attributes which are not shown (cranny plunder,...). These options will be added in a later patch. Page also allows
  you to change hero's ability points, along with the ability to switch hero resource production focus. The dropdown
  shows you production values to expect on change.

* [Feature] A "hero level up" option has been added to developer tools.

## Version 0.1.2

#### Feb 11, 2026

* [BugFix] Fixed an issue where barracks and stable upgrades wouldn't decrease unit training duration.

## Version 0.1.1

#### Feb 11, 2026

* [BugFix] Fixed an issue where upgrading buildings wouldn't increase the building effect values (building duration,
  troop training,...).

* [BugFix] Fixed an issue where environment variables weren't getting injected.

* [Performance] Improved performance of resolving events. Updating resources query now doesn't run, if there's no change
  to resources.

## Version 0.1.0

#### Feb 9, 2026

* [Breaking] This update is not compatible with existing game worlds and requires creation of new game worlds
* [Feature] Player pages - you can now see player information, along with the list of villages they occupy.
* [Feature] Statistics pages - you can now see the ranking of all players and all villages, based on population.
* [Feature] Game world overview page - you can now see the split of tribes, factions and basic game world information.
* [Feature] Oasis bonus finder - long gone are the days of manually checking the map for your perfect location of your
  next village. This tool allows you to find all tiles with specific resource composition and bonuses!
* [Feature] Reworked developer tools - you may now toggle instant completion and cost-free of individual event
  types, add or remove resources, add adventure points or spawn hero items!
* [Feature] Tons of new quests - we've expanded the quest list from humble 160 to over 1000. More will get added as
  development continues!

  From technical improvement perspective, we haven't been idling. New version fixes the long-standing issue of game
  world state corruption, it massively improves developer experience and speed, adds over 200 tests and enables us to
  onboard new contributors easier! These changes were contributed by over 7 new contributors!

## Version 0.0.49

#### Jan 26, 2026

* [Performance] We've improved the performance of the game world creation. You can expect 10-15% faster game world
  generation!

## Version 0.0.48

#### Jan 19, 2026

* [Feature] You'll now be able to start building upgrades faster on mobile! Simply press the building upgrade indicator
  for a second and the building will start upgrading, without you having to open the building interface and clicking the
  build button.

## Version 0.0.47

#### Jan 7, 2026

* [Performance] We've reworked some of the scripts used in game-world generation and as a result, generation is now
  about 10-15% faster. This is especially important on larger worlds or when using a lower-end device, where generation
  may take a couple of seconds.

* [TechnicalImprovement] We transitioned repository to a monorepo. This came with some technical challenges, but also a
  ton of clarity. Project is now much simpler to navigate and reason about!

* [TechnicalImprovement] We've added oxlint to the project. This a new linting tool and it's very promising. Plan is to
  use it side-by-side with Biome (our current linter), with the goal of eventually transitioning fully off of Biome.

## Version 0.0.46

#### Jan 4, 2026

* [Feature] We added game-world-overview page. Thank you very much for your contribution!

## Version 0.0.45

#### Dec 30, 2025

* [Feature] We added player pages! You'll now be able to see general information about each player, along with a list of
  their villages. Thank you very much for your contribution!

## Version 0.0.44

#### Dec 24, 2025

* [Feature] UI color scheme (dark/light mode), graphic skin variant (default, snow,...), locale & graphics day-night
  setting are now persistent between game worlds. This doesn't mean much yet, because we don't have graphics, only
  support a single locale and don't have a dark mode yet, but once those things arrive, you'll be able to set them once
  and have the setting persist through all game worlds.

* [Performance] We've done a minor clean up. In this case, we managed to remove a minor dependency, which reduced the
  final bundle by about ~60kb.

## Version 0.0.43

#### Dec 19, 2025

* [Feature] We now have a global not-found page. We've been seeing a small rise of routing errors lately. We're not sure
  if these are just bots trying different subpages, but in case some real users are getting lost, this should help them
  out a bit.

* [Feature] We've reworked the in-game error pages for game world not found and game world is already opened errors.
  Instead of being redirected to /404 or /403, you'll now remain inside the relevant game world url. This reduces the
  amount of clicks needed to solve a particular error.

## Version 0.0.42

#### Dec 12, 2025

* [BugFix] We've fixed an annoying layout shift, which appeared when changing between village and non-village pages!

* [Performance] We've substantially improved performance of the construct new building page. This page was actually
  flagged as one of the slowest pages we have. The reason for this is that in order to determine which buildings you're
  allowed to construct, we have to run a bunch of checks. While these checks are not that slow individually, we had to
  run these checks multiple times for each building, which added up quickly. We've now reworked this to make it more
  efficient. You should be seeing faster page renders, especially on mid/lower-end devices.

