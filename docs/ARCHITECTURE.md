# Architecture

## State
* State Management: React Query manages the app's state, including caching and background updates.
* Persistence: On every state change, the updated state is serialized and saved to the browser's OPFS (Origin Private File System).
* Restoration: On app startup, the state is restored from OPFS, allowing the app to pick up where it left off.
* Performance: A queue system in a Web Worker ensures only the latest state is persisted, reducing redundant writes.

## App lifecycle

* App Start: The application begins and attempts to restore the previous state.
* Restore last saved state from OPFS: The app checks if a saved state exists in OPFS.
* Hydrate React Query's state.
* User Interaction: As users interact with the app, React Query state is updated accordingly.
* State Change Notification: React Query detects changes in the state and notifies any subscribed components.
* Persist State to OPFS: After each state change, the new state is persisted to OPFS.
* Loop: The process repeats as new state changes occur.


```mermaid
graph TD
    A[App Start] --> B[Restore last saved state from OPFS]
    B --> C[Hydrate React Query State]
    C --> E[User Interacts with App]
    E --> F[React Query State Changes]
    F --> G[React Query Notifies Subscribers]
    G --> H[Persist State to OPFS]
    H --> F[Wait for New State Changes]
