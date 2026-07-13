# Smart To-Do List (DSA Course Project)

A complete standalone Java Swing application showcasing hand-crafted Data Structures and Algorithms (DSA) without relying on Java's built-in collections. Created for academic evaluation, this project demonstrates maximum memory-efficiency, optimal algorithm design, and robust code quality.

---

## Project Overview

Smart To-Do List is a task planner tailored to prove the implementation and execution of fundamental computer science concepts. It features a responsive dashboard, advanced task management utilities, automated actions tracking (history logging), priority queue management, and robust undo capabilities. 

---

## Implemented Data Structures (Manual Implementation)

To meet the strict DSA evaluation criteria, the following data structures were designed and built entirely from scratch:

1. **Singly Linked List (`datastructures.LinkedList`)**
   - **Purpose**: Serves as the primary, memory-efficient collection to store and traverse tasks.
   - **Enhancements**: Maintains both `head` and `tail` references to achieve constant time $O(1)$ additions at the end of the list.

2. **Stack (`datastructures.Stack`)**
   - **Purpose**: Power the robust Multi-Level Undo operations. Recent task additions, deletions, or edits are pushed to the stack and reverted sequentially.
   - **Design**: Built as a dynamic Node-based chain (no capacity constraints) ensuring $O(1)$ push/pop overhead.

3. **Queue (`datastructures.Queue`)**
   - **Purpose**: Bounded Completed Action Log (FIFO history tracking).
   - **Design**: Linked node architecture maintaining standard front and rear pointers for $O(1)$ enqueue and dequeue operations.

4. **Hash Table (`datastructures.HashTable`)**
   - **Purpose**: Ultra-fast $O(1)$ search lookup of tasks by their unique ID.
   - **Design**: Uses Separate Chaining (linked buckets) for collision handling, combined with dynamic array resizing (doubling capacity and rehashing) when the load factor exceeds 75%.

5. **Binary Heap (`datastructures.BinaryHeap`)**
   - **Purpose**: Max-Priority Queue displaying and extracting high priority tasks.
   - **Design**: Array-backed heap with custom `heapifyUp` and `heapifyDown` formulas. Priority levels map from 3 (High) down to 1 (Low) with Creation ID acting as the tie-breaker.

---

## Implemented Algorithms

1. **Merge Sort (`algorithms.MergeSort`)**
   - **Purpose**: Sorts the list of tasks by name (case-insensitive), priority levels, or due date strings.
   - **Design**: Recursive divide-and-conquer strategy matching the optimal $O(n \log n)$ worst-case time complexity.

2. **Binary Search (`algorithms.BinarySearch`)**
   - **Purpose**: Fast search query execution over sorted states.
   - **Design**: Iterative binary search to perform target search operations in $O(\log n)$ time.

---

## Project Architecture & File Structure

```
SmartTodo/
│
├── Main.java                 # Entry point, initializes EDT and sets system L&F
│
├── model/
│   └── Task.java             # Task attributes, priority definitions, and text serializer helpers
│
├── datastructures/
│   ├── Node.java             # Generic node structure for Linked List, Stack, and Queue
│   ├── LinkedList.java       # Custom Singly Linked List primary task container
│   ├── Stack.java            # Node-based LIFO undo stack
│   ├── Queue.java            # Node-based FIFO event logging queue
│   ├── HashTable.java        # Separate chaining hash map mapping ID -> Task
│   └── BinaryHeap.java       # Max-Heap priority queue structure
│
├── algorithms/
│   ├── MergeSort.java        # Dynamic O(n log n) sorting routine
│   └── BinarySearch.java     # Iterative O(log n) lookup engine
│
├── storage/
│   └── FileManager.java      # Flat-file database serializer reading/writing pipe-separated files
│
├── controller/
│   └── TaskManager.java      # Central controller orchestrating data structures and algorithms
│
└── ui/
    ├── MainFrame.java        # Master frame, navigation panels, CardLayout controllers
    ├── DashboardPanel.java   # Statistics cards displaying real-time metrics
    ├── TaskPanel.java        # Active workspace for adding, editing, and deleting tasks
    ├── CompletedPanel.java   # Filtered archive of accomplished agendas
    └── PriorityPanel.java    # Interactive Priority Heap extractor (Root operation)
```

---

## Complexity Analysis

| Operation / Structure | Class & Function | Time Complexity (Average) | Time Complexity (Worst) | Space Complexity (Auxiliary) |
| :--- | :--- | :---: | :---: | :---: |
| **Insert Task** | `LinkedList.insert()` | $O(1)$ | $O(1)$ | $O(1)$ |
| **Delete Task** | `LinkedList.delete()` | $O(n)$ | $O(n)$ | $O(1)$ |
| **Fast ID Search** | `HashTable.search()` | $O(1)$ | $O(n)$ (rehash conflict) | $O(1)$ |
| **Sorting** | `MergeSort.sort()` | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ |
| **Sorted Search** | `BinarySearch.search()` | $O(\log n)$ | $O(\log n)$ | $O(1)$ |
| **Priority Insert** | `BinaryHeap.insert()` | $O(\log n)$ | $O(\log n)$ | $O(1)$ |
| **Priority Extract** | `BinaryHeap.removeMax()` | $O(\log n)$ | $O(\log n)$ | $O(1)$ |
| **Save/Load DB** | `FileManager` | $O(n)$ | $O(n)$ | $O(n)$ |

---

## How to Compile & Run

This project is packaged to run immediately without any third-party build tools (like Gradle or Maven).

### 1. Compile the Source Code
Open your terminal inside the `SmartTodo/` root directory and compile all source modules:
```bash
javac Main.java model/*.java datastructures/*.java algorithms/*.java storage/*.java controller/*.java ui/*.java
```

### 2. Launch the Application
Run the main executable binary:
```bash
java Main
```

---

## Future Improvements

1. **Self-Balancing Binary Search Tree**: Introduce a Red-Black Tree or AVL tree for sorted category views.
2. **Sub-Task Support**: Enable tree-like hierarchical tasks showing parent-child links.
3. **Task Reminders**: Integrate background worker threads using a custom cron scheduler.
