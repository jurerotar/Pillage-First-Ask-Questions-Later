# Auctions

## 1. Introduction

This document provides an overview of hero item trading functionality in **Pillage First, Ask Questions Later**. It
covers implementation details, notes important files, and caveats.

**Please read the documentation on [**HERO](./HERO.md) before starting with this document.**

## 2. Overview

Player's hero unit may be equipped with items. These items may enable special effects, increase hero's
strength or speed, or restore its health. Items may be acquired by looting them from defeated villages,
finding them on adventures, or by
trading them on the auction house. In order to buy an item, you require **Silver**, a currency used exclusively used for
trading in the auction house. Silver, similar to other items, may be acquired by looting villages, finding it on
adventures, or by selling existing items.

### Buying items

At the start of the game world, a list of auctions is posted to the auction house. Every 24 hours, the list is
refreshed. Prices are determined by your reputation with the item seller's faction. Up to 3 auctions may be **reserved
**. If an auction is reserved, it will not be removed during refreshes. This allows you to save wanted items until you
can gather more silver or increase your standing with a faction in order to lower the price.

### Selling items

TODO
