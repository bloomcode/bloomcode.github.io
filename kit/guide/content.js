// Concept guide content: 26 chapters in 8 areas. Prose uses `code` and **bold**; pseudocode is language-neutral.
const GUIDE = {
 "mark": "CG",
 "name": "Concept Guide",
 "sub": "Data structures and algorithms",
 "title": "DSA concept guide · BloomCode",
 "eyebrow": "26 chapters · the ideas behind the 282 exercises",
 "heroTitle": [
  "See how it",
  "works",
  " before you code it."
 ],
 "heroText": "A visual companion to the DSA workbooks. Each chapter explains one idea in plain words, lets you step through it, gives the pattern as language-neutral pseudocode, and lists what each operation costs. When it clicks, open the same chapter in your Python, Java or Go workbook.",
 "heroPoints": [
  [
   "Read",
   "the idea and the mental model: what the structure promises, and why."
  ],
  [
   "Step",
   "through the visualizer. Every frame is computed by the real algorithm, not drawn by hand."
  ],
  [
   "Check",
   "the cost table and the one mistake that catches most people."
  ],
  [
   "Practice",
   "in your language. Links jump straight to that chapter's exercises."
  ]
 ],
 "parts": [
  [
   "Cost and measurement",
   [
    11,
    12,
    13
   ]
  ],
  [
   "Sequences",
   [
    21,
    22,
    23,
    24
   ]
  ],
  [
   "Sorting",
   [
    31,
    32
   ]
  ],
  [
   "Hashing",
   [
    41,
    42,
    43
   ]
  ],
  [
   "Trees",
   [
    51,
    52,
    53,
    54,
    55
   ]
  ],
  [
   "Graphs",
   [
    61,
    62
   ]
  ],
  [
   "Algorithm design",
   [
    71,
    72,
    73,
    74
   ]
  ],
  [
   "Systems and scale",
   [
    81,
    82,
    83
   ]
  ]
 ],
 "chapters": [
  {
   "ch": 11,
   "title": "Counting steps: how cost grows with input",
   "short": "Counting steps",
   "idea": "Name N, count how often the innermost line runs, and let Big O keep only the part that grows fastest.",
   "topics": [
    {
     "title": "How the step count grows",
     "body": [
      "Big O describes the shape of the growth, not the exact count. 3N steps and N steps are both **O(N)**, because doubling the data doubles the work in both cases.",
      "Unless stated otherwise, Big O means the **worst case**. Planning for the worst case means you are never surprised.",
      "`log N` is the number of times you can halve N before you reach 1. It is the cost of anything that discards half the problem at each step, like binary search."
     ],
     "model": [
      "O(1): the same steps whatever the size. O(N): one pass over the data.",
      "O(log N): halving. O(N log N): halving, with a full pass at each level.",
      "O(N²): every item meets every other item, usually nested loops.",
      "O(2ⁿ): every item doubles the work, so each extra item doubles the time."
     ],
     "widget": "growth",
     "pseudo": "function isPrime(n):              // O(N): one loop up to n\n    for d from 2 to n - 1:\n        if n mod d == 0: return false\n    return n >= 2\n\nfunction halvings(n):             // O(log N): n halves each time\n    count = 0\n    while n > 1:\n        n = n / 2\n        count = count + 1\n    return count",
     "costs": [
      [
       "Constant",
       "O(1)",
       "array read, hash lookup"
      ],
      [
       "Logarithmic",
       "O(log N)",
       "binary search"
      ],
      [
       "Linear",
       "O(N)",
       "one loop over the data"
      ],
      [
       "Quadratic",
       "O(N^2)",
       "nested loops over the same data"
      ],
      [
       "Exponential",
       "O(2^N)",
       "every subset"
      ]
     ],
     "pitfall": "Big O ignores constants, so O(N) code can still be slower than O(N²) code on small inputs. It describes growth, not speed at one size."
    },
    {
     "title": "Reading ordinary code",
     "body": [
      "Most code is loops over collections. Name N first: the number of items, the number of characters, the number of rows. Then count how many times the innermost line runs as N grows.",
      "Not every pair of nested loops is O(N²). Two loops over **different** inputs are O(N × M). A loop over sub-arrays inside a loop over arrays is O(N), where N is the total number of values, because each value is visited once.",
      "Watch for code that is worse than it looks. Generating every on/off setting of N switches is O(2ᴺ): adding one switch doubles the work."
     ],
     "model": [
      "Define N before you classify anything.",
      "Count how often the innermost line runs, not how many loops you see.",
      "Inner loops that start at `i + 1` still give O(N²): N²/2 drops its constant.",
      "Loops over different inputs give O(N × M), not O(N²)."
     ],
     "widget": "classify",
     "pseudo": "function pairings(names):     // O(N^2): about N^2/2 pairings\n    out = []\n    for i from 0 to length(names) - 1:\n        for j from i + 1 to length(names) - 1:\n            append names[i] + \"-\" + names[j] to out\n    return out\n\nfunction countVowels(lines):     // O(N), N = total characters\n    count = 0\n    for each line in lines:\n        for each ch in line:\n            if ch is a vowel: count = count + 1\n    return count",
     "costs": [
      [
       "Running balance",
       "O(N)",
       "one pass"
      ],
      [
       "All pairings from one list",
       "O(N^2)",
       "N²/2 is still N²"
      ],
      [
       "Shared hours across two lists",
       "O(N × M)",
       "two different sizes"
      ],
      [
       "Every switch setting",
       "O(2^N)",
       "two choices per switch"
      ]
     ],
     "pitfall": "Calling a built-in inside a loop hides a loop: `contains`, `indexOf` or slicing on an array is O(N) each time."
    }
   ],
   "ex": "11.1–11.16"
  },
  {
   "ch": 12,
   "title": "Memory as a cost",
   "short": "Memory",
   "idea": "Count memory the way you count steps: how much extra space does the algorithm need as N grows?",
   "topics": [
    {
     "title": "Memory as a cost",
     "body": [
      "Space complexity measures the **extra** memory an algorithm allocates, not the input itself. Building a new array of N items is O(N) space; modifying the input in place is O(1).",
      "Recursion has a hidden cost: every waiting call holds a frame on the call stack. A recursion N levels deep needs O(N) space even if it allocates nothing, and enough depth crashes with a stack overflow, where a loop would not.",
      "Time and space trade off. A table of counts finds the most frequent value in O(N) time but O(N) space; sorting in place finds it in O(N log N) time with no table of its own. Choose based on which resource is scarce."
     ],
     "model": [
      "Count only new memory: new arrays, maps, and call-stack frames.",
      "In place usually means two indices that walk towards each other.",
      "Recursion depth is space: O(depth).",
      "State both: \"O(N) time, O(1) space\"."
     ],
     "widget": "space",
     "pseudo": "function reverseInPlace(arr):        // O(N) time, O(1) space\n    i = 0; j = length(arr) - 1\n    while i < j:\n        swap arr[i], arr[j]\n        i = i + 1; j = j - 1\n\nfunction sumRecursive(arr, i):         // O(N) time, O(N) stack\n    if i == length(arr): return 0\n    return arr[i] + sumRecursive(arr, i + 1)",
     "costs": [
      [
       "Scaled copy of N scores",
       "O(N)",
       "extra space"
      ],
      [
       "Scale in place",
       "O(1)",
       "extra space"
      ],
      [
       "Recursion depth N",
       "O(N)",
       "stack frames"
      ],
      [
       "Most frequent: table vs sort in place",
       "O(N)",
       "vs O(1) extra space"
      ]
     ],
     "pitfall": "\"No new array\" is not always O(1) space. Recursion and string building can still allocate O(N)."
    }
   ],
   "ex": "12.1–12.5"
  },
  {
   "ch": 13,
   "title": "Timing real code",
   "short": "Timing",
   "idea": "Big O predicts how time grows; a careful benchmark tells you the actual time, and checks the prediction.",
   "topics": [
    {
     "title": "Timing real code",
     "body": [
      "Big O ignores constants, caches and the runtime. To compare two O(N log N) sorts, or to check that code really is O(N), you have to **measure**. Use a monotonic high-resolution clock, run the code many times, and report the **minimum**: noise from other processes and the garbage collector only ever adds time.",
      "Measure only what you mean to. The classic mistake is sorting the same array on every run: after the first run it is already sorted, and every later run times the best case. Copy fresh input before each run and keep the copy outside the timed region. On JIT runtimes, warm up first so you time the optimized code.",
      "To read a Big O off measurements, time several sizes that double. If the time doubles, it is O(N); if it quadruples, O(N²). The slope of log(time) against log(N) gives the exponent directly."
     ],
     "model": [
      "Monotonic clock, many repetitions, keep the minimum.",
      "Time the algorithm, not the setup: copy the input outside the timer.",
      "Doubling N: time ×2 → O(N), ×4 → O(N²), slightly over ×2 → O(N log N).",
      "Benchmarks expose worst cases Big O hides, like quicksort on sorted input."
     ],
     "widget": "benchLab",
     "pseudo": "function bench(task, makeInput, repeats):\n    best = infinity\n    repeat repeats times:\n        input = makeInput()              // setup, outside the timer\n        start = monotonicNow()\n        task(input)\n        best = min(best, monotonicNow() - start)\n    return best\n\nfunction growthExponent(sizes, times):  // slope on a log-log plot\n    return slope of the best-fit line through (log n, log t)",
     "costs": [
      [
       "Time one call",
       "O(1)",
       "overhead of the clock"
      ],
      [
       "Repeat R runs",
       "O(R × cost)",
       "keep the minimum"
      ],
      [
       "Quicksort on sorted input (end pivot)",
       "O(N^2)",
       "the benchmark shows it"
      ],
      [
       "Adaptive sort on nearly sorted data",
       "O(N)",
       "few runs to merge"
      ]
     ],
     "pitfall": "Timing one run of fast code mostly measures the clock and the noise. Repeat until each batch takes at least milliseconds."
    }
   ],
   "ex": "13.1–13.7"
  },
  {
   "ch": 21,
   "title": "Arrays and dynamic arrays",
   "short": "Arrays",
   "idea": "The same data, organized differently, makes the same operation cost one step or a million.",
   "topics": [
    {
     "title": "Arrays",
     "body": [
      "Measure code in **steps**, not seconds. Seconds depend on the machine; steps depend only on the algorithm, so they let you compare ideas.",
      "An array is one unbroken block of memory. The computer knows where the block starts, so the address of any index is `start + index × size`. That is why reading `arr[i]` takes one step no matter how long the array is.",
      "Everything else follows from the block having no gaps. Insert at the front and every item has to move one slot right to make room. Delete from the front and every item moves left to close the gap. At the end, nothing moves.",
      "A set is an array that refuses duplicates. That one rule means every insert must search first, so insertion goes from one step to about N."
     ],
     "model": [
      "Read: jump straight to the address. Search: look at cells one by one.",
      "The further from the end you insert or delete, the more items have to shift.",
      "Count the worst case: insert at index 0 of N items takes N shifts plus 1 write.",
      "A dynamic array doubles its capacity when full, so appending stays O(1) on average."
     ],
     "widget": "arrayOps",
     "pseudo": "function insertAt(arr, index, value):\n    // make room: shift everything from the end down to index\n    for i from length(arr) - 1 down to index:\n        arr[i + 1] = arr[i]\n    arr[index] = value\n    length(arr) = length(arr) + 1\n\nfunction deleteAt(arr, index):\n    for i from index to length(arr) - 2:\n        arr[i] = arr[i + 1]          // close the gap\n    length(arr) = length(arr) - 1",
     "costs": [
      [
       "Read by index",
       "O(1)",
       "one address calculation"
      ],
      [
       "Search (linear)",
       "O(N)",
       "worst case checks every cell"
      ],
      [
       "Insert / delete at end",
       "O(1)",
       "nothing moves"
      ],
      [
       "Insert / delete at start",
       "O(N)",
       "N items shift"
      ],
      [
       "Set insert",
       "O(N)",
       "search for a duplicate first"
      ]
     ],
     "pitfall": "Shift **from the end backwards** when inserting. Going forwards copies the same value into every slot."
    }
   ],
   "ex": "21.1–21.19"
  },
  {
   "ch": 22,
   "title": "Searching sorted data",
   "short": "Sorted search",
   "idea": "Keeping data sorted makes insertion slower and search exponentially faster.",
   "topics": [
    {
     "title": "Sorted search",
     "body": [
      "An ordered array keeps its values sorted at all times. Insertion pays for that: first find the right spot, then shift everything after it.",
      "Search gets two wins. Linear search can stop early as soon as it passes a bigger value. Better still, **binary search** checks the middle and throws away the half that cannot hold the target.",
      "Each comparison halves what is left. 100 items take at most 7 steps, a million take 20, a billion take 30. Doubling the data adds just **one** step."
     ],
     "model": [
      "Binary search keeps a window `[lo, hi]` that must contain the target if it exists.",
      "Look at `mid`; move `lo` past it or `hi` before it. Stop when the window is empty.",
      "The same window finds the insertion point (lower bound), the first or the last copy of a value.",
      "Trade-off: ordered arrays are slower to insert into, but much faster to search."
     ],
     "widget": "binarySearch",
     "pseudo": "function binarySearch(sorted, target):\n    lo = 0\n    hi = length(sorted) - 1\n    while lo <= hi:\n        mid = (lo + hi) / 2          // integer division\n        if sorted[mid] == target: return mid\n        if sorted[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1                        // window empty: not present",
     "costs": [
      [
       "Search (binary)",
       "O(log N)",
       "halve the window each step"
      ],
      [
       "Search (linear, early exit)",
       "O(N)",
       "still N in the worst case"
      ],
      [
       "Insert",
       "O(N)",
       "find the spot, then shift"
      ],
      [
       "Delete",
       "O(N)",
       "close the gap"
      ]
     ],
     "pitfall": "Write `lo <= hi`, not `lo < hi`, or you skip the last remaining candidate. Always move past `mid` (`mid + 1`, `mid - 1`) or the loop can run forever."
    }
   ],
   "ex": "22.1–22.10"
  },
  {
   "ch": 23,
   "title": "Linked lists",
   "short": "Linked lists",
   "idea": "Nodes scattered in memory, joined by links: the same operations as an array, with the opposite costs.",
   "topics": [
    {
     "title": "Linked lists",
     "body": [
      "A linked list stores each value in a **node** that also holds a link to the next node. Nodes can live anywhere in memory; the list only remembers the first one (the head).",
      "Without one block of memory there is no address arithmetic, so reading index i means following i links: O(N). But inserting or deleting at the head is just relinking: O(1), with no shifting at all.",
      "In the middle you pay O(N) to walk there, then O(1) to relink. That makes linked lists shine when you are already at the right node, for example deleting items while walking the list. A **doubly linked** list with a tail pointer gives O(1) at both ends, which makes it an ideal queue."
     ],
     "model": [
      "Array: fast read, slow insert at the front. Linked list: slow read, fast insert at the front.",
      "To insert after node X: new.next = X.next, then X.next = new. In that order.",
      "To delete after X: X.next = X.next.next.",
      "Fast and slow pointers find the middle or detect a cycle in one pass."
     ],
     "widget": "linkedList",
     "pseudo": "function insertAt(list, index, value):\n    node = new Node(value)\n    if index == 0:\n        node.next = list.head; list.head = node; return\n    current = list.head\n    repeat index - 1 times: current = current.next   // walk: O(N)\n    node.next = current.next                         // relink: O(1)\n    current.next = node\n\nfunction reverse(list):\n    previous = null; current = list.head\n    while current != null:\n        next = current.next\n        current.next = previous\n        previous = current; current = next\n    list.head = previous",
     "costs": [
      [
       "Read / search",
       "O(N)",
       "follow the links"
      ],
      [
       "Insert / delete at head",
       "O(1)",
       "relink only"
      ],
      [
       "Insert / delete at index",
       "O(N)",
       "walk there, then O(1)"
      ],
      [
       "Ends of a doubly linked list",
       "O(1)",
       "head and tail pointers"
      ]
     ],
     "pitfall": "Relink in the right order. If you set `current.next = node` first, you lose the rest of the list."
    }
   ],
   "ex": "23.1–23.16"
  },
  {
   "ch": 24,
   "title": "Stacks and queues",
   "short": "Stacks and queues",
   "idea": "Constrained structures are tools for ordering work: last in first out, or first in first out.",
   "topics": [
    {
     "title": "Stacks and queues",
     "body": [
      "A **stack** adds and removes only at the top: push, pop, peek. The most recent item comes out first, which is exactly what matching brackets, undo, and the call stack need.",
      "A **queue** adds at the back and removes from the front: enqueue, dequeue. Items leave in arrival order, which is what job scheduling, round-robin turns and breadth-first search need.",
      "Both are abstract data types: rules about behaviour, not a storage layout. You can build them on an array or a linked list. The constraint is the point: code that can only touch the top cannot accidentally break the order."
     ],
     "model": [
      "Stack: LIFO. Push, pop and peek all work at the top, O(1).",
      "Queue: FIFO. Enqueue at the back, dequeue at the front, O(1) with the right implementation.",
      "Tag checker: push each opening tag, pop on a closing tag and check it matches, and the stack must end empty.",
      "Two stacks make a queue: pour the inbox into the outbox only when the outbox is empty."
     ],
     "widget": "brackets",
     "pseudo": "function lint(text):\n    stack = empty stack\n    pairs = { \")\": \"(\", \"]\": \"[\", \"}\": \"{\" }\n    for each ch in text:\n        if ch is one of \"([{\": push ch onto stack\n        else if ch is one of \")]}\":\n            if stack is empty: return \"unexpected \" + ch\n            if pop(stack) != pairs[ch]: return \"mismatched \" + ch\n    if stack is not empty: return \"unclosed \" + peek(stack)\n    return \"ok\"",
     "costs": [
      [
       "Push / pop / peek",
       "O(1)",
       "top only"
      ],
      [
       "Enqueue / dequeue",
       "O(1)",
       "linked list or circular buffer"
      ],
      [
       "Dequeue from an array's front",
       "O(N)",
       "shifting: avoid it"
      ],
      [
       "Search inside",
       "O(N)",
       "not what these are for"
      ]
     ],
     "pitfall": "Removing from the front of a plain array is O(N), because everything shifts. Use a circular buffer, a linked list, or the language's deque."
    }
   ],
   "ex": "24.1–24.9"
  },
  {
   "ch": 31,
   "title": "Simple sorts: bubble, selection and insertion",
   "short": "Simple sorts",
   "idea": "Three ways to sort by repeated small steps: each is O(N²) in the worst case, and each has a case where it shines.",
   "topics": [
    {
     "title": "Bubble sort",
     "body": [
      "Bubble sort walks the array comparing neighbours and swapping any pair that is out of order. After each pass the largest unsorted value has bubbled to the end, so the sorted tail grows by one.",
      "For N items that is (N−1) + (N−2) + … + 1 = N(N−1)/2 comparisons, and up to as many swaps. Double the data and the work roughly **quadruples**: that is O(N²).",
      "The chapter's real lesson is about nested loops. Counting equal pairs by comparing every pair is O(N²). Counting how often each value has appeared so far does the same job in one pass, O(N)."
     ],
     "model": [
      "Two nested loops over the same data are the classic sign of O(N²).",
      "Bubble sort: each pass fixes one more value at the end.",
      "Stop early if a pass makes no swaps: the array is already sorted.",
      "To remove a nested loop, remember what you have seen so far (in an array, set or map)."
     ],
     "widget": "bubble",
     "pseudo": "function bubbleSort(arr):\n    unsortedUntil = length(arr) - 1\n    sorted = false\n    while not sorted:\n        sorted = true\n        for i from 0 to unsortedUntil - 1:\n            if arr[i] > arr[i + 1]:\n                swap arr[i], arr[i + 1]\n                sorted = false\n        unsortedUntil = unsortedUntil - 1",
     "costs": [
      [
       "Bubble sort (worst)",
       "O(N^2)",
       "N²/2 comparisons and swaps"
      ],
      [
       "Bubble sort (sorted input, early exit)",
       "O(N)",
       "one pass with no swaps"
      ],
      [
       "Equal pairs, nested loops",
       "O(N^2)",
       "every pair compared"
      ],
      [
       "Equal pairs, counts table",
       "O(N)",
       "one pass with lookups"
      ]
     ],
     "pitfall": "The inner loop must stop at `unsortedUntil - 1` because it reads `arr[i + 1]`. Running it to the last index reads past the end."
    },
    {
     "title": "Selection sort",
     "body": [
      "Selection sort scans the unsorted part for its smallest value, then makes **one** swap to put it in place. Comparisons are still N(N−1)/2, but swaps drop to at most N−1.",
      "So selection sort does about half the steps of bubble sort, yet both are O(N²). Big O ignores constants on purpose: it puts algorithms into broad categories by growth.",
      "When two algorithms share a category, count the steps more precisely or measure them. That is when constants matter."
     ],
     "model": [
      "Big O compares algorithms in different classes; step counts compare ones in the same class.",
      "Selection sort: scan for the minimum, swap once per pass.",
      "N²/2 is still O(N²): the ½ disappears, and so do lower-order terms.",
      "Constant-factor wins (skipping half the items, fewer swaps) are real speed-ups."
     ],
     "widget": "selection",
     "pseudo": "function selectionSort(arr):\n    for i from 0 to length(arr) - 2:\n        lowest = i\n        for j from i + 1 to length(arr) - 1:\n            if arr[j] < arr[lowest]: lowest = j\n        if lowest != i:\n            swap arr[i], arr[lowest]    // one swap per pass",
     "costs": [
      [
       "Selection sort comparisons",
       "O(N^2)",
       "N(N−1)/2, on any input"
      ],
      [
       "Selection sort swaps",
       "O(N)",
       "at most N − 1"
      ],
      [
       "Bubble sort swaps (worst)",
       "O(N^2)",
       "up to N(N−1)/2"
      ]
     ],
     "pitfall": "Selection sort is **not** faster on sorted input: it still compares every remaining pair. Its saving is in swaps, not comparisons."
    },
    {
     "title": "Insertion sort",
     "body": [
      "Insertion sort lifts out one value at a time and shifts bigger values in the sorted part to the right until there is a gap where it belongs.",
      "On reversed data every value shifts all the way: about N²/2 comparisons and shifts, O(N²). On **already sorted** data each value compares once and stays put: about N steps. On random data, each value travels about halfway: about N²/4.",
      "So for data that is mostly sorted, insertion sort beats selection sort comfortably, though both are O(N²) in the worst case. The best choice depends on the data you actually expect."
     ],
     "model": [
      "Best case: sorted input, O(N). Worst: reversed input, O(N²). Average: about half the worst.",
      "Each value stops as soon as it meets a smaller one, which is where the early exit comes from.",
      "Fast built-in sorts use insertion sort for small or nearly sorted pieces.",
      "Choose algorithms for the data you expect, not just for the worst case."
     ],
     "widget": "insertion",
     "pseudo": "function insertionSort(arr):\n    for i from 1 to length(arr) - 1:\n        temp = arr[i]\n        pos = i - 1\n        while pos >= 0 and arr[pos] > temp:\n            arr[pos + 1] = arr[pos]    // shift right\n            pos = pos - 1\n        arr[pos + 1] = temp",
     "costs": [
      [
       "Insertion sort, best (sorted)",
       "O(N)",
       "one comparison per value"
      ],
      [
       "Insertion sort, average",
       "O(N^2)",
       "about N²/4 shifts"
      ],
      [
       "Insertion sort, worst (reversed)",
       "O(N^2)",
       "about N²/2 shifts"
      ],
      [
       "Nearly sorted, at most k places off",
       "O(N × k)",
       "each value shifts at most k"
      ]
     ],
     "pitfall": "Save the value in `temp` **before** shifting, because the first shift overwrites its slot."
    }
   ],
   "ex": "31.1–31.16"
  },
  {
   "ch": 32,
   "title": "Divide and conquer: mergesort, quicksort and quickselect",
   "short": "Divide and conquer",
   "idea": "Split the input, solve the parts, combine: quicksort splits carefully, mergesort combines carefully.",
   "topics": [
    {
     "title": "Partitioning: quicksort and quickselect",
     "body": [
      "**Partition** picks a pivot (here the rightmost value). A left pointer moves right until it finds a value ≥ pivot; a right pointer moves left until it finds one ≤ pivot. Swap them and continue. When the pointers cross, swap the pivot into the left pointer's slot. The pivot is now exactly where it belongs.",
      "**Quicksort** partitions, then quicksorts each side. With pivots near the middle the array halves each level: log N levels of O(N) work, O(N log N). With pivots at an extreme, such as sorted input with a rightmost pivot, each level removes one value, O(N²).",
      "**Quickselect** partitions and recurses into only the side that holds the k-th value, O(N) on average. And sorting first is itself a technique: the closest pair, overlapping meetings and distinct values all get easier once equal and nearby values sit side by side."
     ],
     "model": [
      "After a partition, the pivot never moves again.",
      "Good pivots halve the array; bad pivots peel off one value.",
      "Average O(N log N), worst O(N²); random pivots make the worst case very unlikely.",
      "Quickselect follows one side only: N + N/2 + N/4 + … ≈ 2N."
     ],
     "widget": "quicksort",
     "pseudo": "function partition(arr, left, right):\n    pivotIndex = right; pivot = arr[right]; right = right - 1\n    loop:\n        while left <= right and arr[left] < pivot: left = left + 1\n        while right >= left and arr[right] > pivot: right = right - 1\n        if left >= right: break\n        swap arr[left], arr[right]\n        left = left + 1; right = right - 1\n    swap arr[left], arr[pivotIndex]\n    return left\n\nfunction quicksort(arr, left, right):\n    if right - left <= 0: return\n    p = partition(arr, left, right)\n    quicksort(arr, left, p - 1)\n    quicksort(arr, p + 1, right)",
     "costs": [
      [
       "Partition",
       "O(N)",
       "one sweep"
      ],
      [
       "Quicksort (average)",
       "O(N log N)",
       "balanced splits"
      ],
      [
       "Quicksort (worst)",
       "O(N^2)",
       "sorted input, end pivot"
      ],
      [
       "Quickselect (average)",
       "O(N)",
       "one side only"
      ]
     ],
     "pitfall": "Stop both pointer loops on values **equal** to the pivot. Otherwise arrays full of duplicates degrade to O(N²)."
    },
    {
     "title": "Mergesort and stable sorting",
     "body": [
      "**Merge** walks two sorted lists with one finger in each, repeatedly taking the smaller front value. Every comparison places one value, so merging N + M items takes at most N + M − 1 comparisons.",
      "**Mergesort** splits the array in half, sorts each half recursively, and merges the results. There are log₂ N levels of halving, and each level merges N values in total, so the cost is O(N log N) on **every** input. Quicksort cannot promise that.",
      "The price is O(N) extra space for merging. In return mergesort is **stable**: equal keys keep their original order, provided ties take from the left list. It also merges data that arrives in pieces, which is the basis of sorting files bigger than memory (Chapter 82)."
     ],
     "model": [
      "Top-down: split, recurse, merge. Bottom-up: merge runs of width 1, 2, 4, … with no recursion.",
      "Take from the left list on ties (`<=`): that one character makes the sort stable.",
      "Each value is copied once per level, so N log N moves in total.",
      "Small pieces are faster with insertion sort, which is why real sorts are hybrids."
     ],
     "widget": "mergeViz",
     "pseudo": "function merge(a, b):\n    out = []; i = 0; j = 0\n    while i < length(a) and j < length(b):\n        if a[i] <= b[j]: append a[i] to out; i = i + 1   // <= keeps it stable\n        else:            append b[j] to out; j = j + 1\n    append the rest of a and the rest of b to out\n    return out\n\nfunction mergesort(arr):\n    if length(arr) <= 1: return arr\n    mid = length(arr) / 2\n    return merge(mergesort(arr[0 .. mid)), mergesort(arr[mid .. end)))",
     "costs": [
      [
       "Merge N + M items",
       "O(N + M)",
       "≤ N + M − 1 comparisons"
      ],
      [
       "Mergesort, any input",
       "O(N log N)",
       "log N levels × N"
      ],
      [
       "Extra space",
       "O(N)",
       "the merge buffer"
      ],
      [
       "Count inversions while merging",
       "O(N log N)",
       "versus O(N²) pairs"
      ]
     ],
     "pitfall": "Using `<` instead of `<=` in the merge still sorts correctly but breaks stability, and the bug only shows up when records have equal keys."
    }
   ],
   "ex": "32.1–32.16"
  },
  {
   "ch": 41,
   "title": "Hash tables",
   "short": "Hash tables",
   "idea": "A hash function turns a key into an array index, so finding a value takes one step on average.",
   "topics": [
    {
     "title": "Hash tables",
     "body": [
      "A hash table stores key–value pairs in an array of buckets. A **hash function** maps each key to a bucket number. It must be deterministic: the same key always gives the same bucket.",
      "Two keys can land in the same bucket, a **collision**. Separate chaining keeps a small list in each bucket and searches it. With a good hash function and enough buckets, chains stay short and lookups stay O(1) on average.",
      "The everyday payoff is turning O(N²) searches into O(N). Put one list into a set or map, then check the other list against it: each check takes one step instead of a scan."
     ],
     "model": [
      "Lookup: hash the key, go to that bucket, scan its short chain.",
      "Keep the load factor (items ÷ buckets) around 0.7 or below; grow and rehash beyond that.",
      "A set is a hash table with keys only.",
      "Worst case is O(N), when every key collides, so a good hash function matters (Chapter 42)."
     ],
     "widget": "hashTable",
     "pseudo": "function put(table, key, value):\n    bucket = table.buckets[hash(key) mod length(table.buckets)]\n    for each pair in bucket:\n        if pair.key == key:\n            pair.value = value; return\n    append (key, value) to bucket\n\nfunction isSubset(small, big):        // O(N + M) instead of O(N × M)\n    seen = new set of big\n    for each x in small:\n        if x not in seen: return false\n    return true",
     "costs": [
      [
       "Lookup / insert / delete (average)",
       "O(1)",
       "short chains"
      ],
      [
       "Lookup (worst, all collide)",
       "O(N)",
       "one long chain"
      ],
      [
       "Values in exactly one list, with sets",
       "O(N + M)",
       "versus O(N × M) nested"
      ],
      [
       "Group or count items",
       "O(N)",
       "one pass with a map"
      ]
     ],
     "pitfall": "Hash tables do not keep any useful order. If you need sorted keys, sort them, or use a tree."
    }
   ],
   "ex": "41.1–41.10"
  },
  {
   "ch": 42,
   "title": "Hash functions",
   "short": "Hash functions",
   "idea": "Any fixed hash function has inputs that crush it; choosing the function at random removes them.",
   "topics": [
    {
     "title": "Hash functions",
     "body": [
      "A hash table is only O(1) if keys spread evenly over buckets. Adding up character codes makes every anagram collide. The **division method** `k mod m` is fine for random keys, but keys that share a factor with m pile into a few buckets: multiples of 8 into 64 buckets use only 8 of them. A prime m, or the **multiplication method** `floor(m · frac(k · A))`, spreads such patterns out.",
      "Worse, if the function is fixed and known, an attacker can pick keys that all collide, turning every lookup into O(N). That is a real denial-of-service attack called hash flooding.",
      "**Universal hashing** picks the function at random when the table is created: `h(k) = ((a·k + b) mod p) mod m` with a random a and b and a large prime p. For any two distinct keys, the collision chance is about 1/m, whatever keys the attacker chose. Pick a fresh function whenever the table grows."
     ],
     "model": [
      "Good hashing: every bucket gets about N/m keys.",
      "Patterned keys plus an unlucky m means crowded buckets.",
      "A random function chosen after the keys are fixed has no bad inputs.",
      "Polynomial string hashing makes order matter: \"stop\" ≠ \"pots\"."
     ],
     "widget": "hashSpread",
     "pseudo": "function divisionHash(k, m):        return k mod m\nfunction multiplicationHash(k, m):  return floor(m * frac(k * 0.6180339887))\n\nfunction newUniversalHash(m, rng):\n    p = 2^61 - 1                          // a large prime\n    a = rng.integer(1, p - 1); b = rng.integer(0, p - 1)\n    return function(k): ((a * k + b) mod p) mod m\n\nfunction polyHash(s, m):\n    h = 0\n    for each ch in s: h = (h * 31 + code(ch)) mod m\n    return h",
     "costs": [
      [
       "Hash a key",
       "O(1)",
       "O(length) for strings"
      ],
      [
       "Lookup, good spread",
       "O(1)",
       "expected"
      ],
      [
       "Lookup, adversarial keys",
       "O(N)",
       "fixed function"
      ],
      [
       "Universal hashing, any keys",
       "O(1)",
       "expected, ≈ 1/m collisions"
      ]
     ],
     "pitfall": "`a·k` needs more than 64 bits when p is near 2⁶¹. Use a 128-bit product (or reduce cleverly), or the hash silently loses its guarantees."
    }
   ],
   "ex": "42.1–42.8"
  },
  {
   "ch": 43,
   "title": "Rolling hashes and text search",
   "short": "Text search",
   "idea": "Hash every window of the text in O(1) each by rolling the hash, and compare hashes instead of strings.",
   "topics": [
    {
     "title": "Text search",
     "body": [
      "Brute-force search compares the needle at every position: O(N × M) in the worst case. Rabin–Karp compares a **hash** of each text window with the needle's hash, and only compares characters when the hashes match.",
      "The trick is the **rolling hash**. Treat a window of M letters as an M-digit number in base 26, modulo a large prime p. To slide one position, remove the leading digit times 26^(M−1), multiply by 26, and add the new digit. Each window costs O(1), the same idea as a sliding-window sum.",
      "Different windows can share a hash, a **spurious hit**, with probability about 1/p each. Verifying every hit makes the answer always right (Las Vegas, expected O(N + M)). Skipping verification makes it strictly O(N + M) with a tiny chance of a false match (Monte Carlo). A tiny modulus like 7 shows the spurious hits plainly."
     ],
     "model": [
      "Window hash = base-26 number mod p.",
      "Slide: subtract the leaving digit × 26^(M−1), × 26, add the entering digit.",
      "Equal hash: probably equal strings; unequal hash: definitely different.",
      "Expected spurious hits ≈ N / p, so choose p large."
     ],
     "widget": "rabinKarp",
     "pseudo": "function rabinKarp(text, needle, p):\n    m = length(needle); high = 26^(m - 1) mod p\n    target = hash(needle); h = hash(text[0 .. m))\n    for i from 0 to length(text) - m:\n        if h == target and text[i .. i + m) == needle:   // verify\n            report i\n        if i + m < length(text):                         // roll\n            h = (h - code(text[i]) * high) mod p\n            h = (h * 26 + code(text[i + m])) mod p",
     "costs": [
      [
       "Brute force",
       "O(N × M)",
       "worst case"
      ],
      [
       "Rabin–Karp, verified",
       "O(N + M)",
       "expected"
      ],
      [
       "Rabin–Karp, unverified",
       "O(N + M)",
       "worst case; tiny error"
      ],
      [
       "K needles of one length",
       "O(N + K × M)",
       "one rolling pass"
      ]
     ],
     "pitfall": "After subtracting, the value can go negative, and `%` keeps the sign in most languages. Add p before taking the remainder."
    }
   ],
   "ex": "43.1–43.8"
  },
  {
   "ch": 51,
   "title": "Binary search trees",
   "short": "Search trees",
   "idea": "Ordered like a sorted array, but inserting and deleting take O(log N) when the tree is balanced.",
   "topics": [
    {
     "title": "Binary search trees",
     "body": [
      "In a binary search tree every node's **left** subtree holds smaller values and its **right** subtree larger ones. Search compares with the root and goes left or right, discarding a whole subtree each step, like binary search.",
      "Insert follows the same path and hangs the new node where the search fell off the tree. Delete has three cases: a leaf is simply removed; a node with one child is replaced by that child; a node with two children is replaced by its **successor**, the leftmost node of its right subtree.",
      "All of this is O(log N) only while the tree is balanced. Insert sorted values and every node goes right: the tree becomes a linked list and everything is O(N). Chapter 54 fixes that with red-black trees and treaps."
     ],
     "model": [
      "Smaller goes left, bigger goes right, at every node.",
      "In-order traversal (left, node, right) visits the values in sorted order.",
      "Successor = one step right, then left as far as possible.",
      "Balanced height ≈ log₂ N; sorted inserts give height N."
     ],
     "widget": "bst",
     "pseudo": "function search(node, value):\n    while node != null:\n        if value == node.value: return node\n        node = (value < node.value) ? node.left : node.right\n    return null\n\nfunction insert(node, value):\n    if node == null: return new Node(value)\n    if value < node.value: node.left = insert(node.left, value)\n    else if value > node.value: node.right = insert(node.right, value)\n    return node",
     "costs": [
      [
       "Search / insert / delete (balanced)",
       "O(log N)",
       "one path from the root"
      ],
      [
       "Search / insert / delete (degenerate)",
       "O(N)",
       "sorted inserts"
      ],
      [
       "In-order traversal",
       "O(N)",
       "every node once"
      ],
      [
       "Min / max",
       "O(log N)",
       "leftmost / rightmost"
      ]
     ],
     "pitfall": "Checking only `left.value < node.value < right.value` does not validate a BST. Every value in the left subtree must be smaller, so pass down lower and upper bounds."
    }
   ],
   "ex": "51.1–51.10"
  },
  {
   "ch": 52,
   "title": "Heaps and priority queues",
   "short": "Heaps",
   "idea": "A complete tree where every parent outranks its children: the top is always the highest priority.",
   "topics": [
    {
     "title": "Heaps",
     "body": [
      "A max-heap has two rules: every node is **greater than or equal to** its children (the heap condition), and the tree is **complete**, filled level by level from the left. Unlike a BST, there is no left-versus-right order.",
      "Completeness lets the tree live in an array with no links: the children of index i are 2i + 1 and 2i + 2, and its parent is (i − 1) / 2. The last node is simply the last array slot.",
      "Insert at the end, then **trickle up**, swapping with the parent while bigger. To remove the root, move the last node to the top, then **trickle down**, swapping with the larger child. Both walk one path: O(log N). That makes heaps the standard priority queue."
     ],
     "model": [
      "Read the max: O(1), it is index 0.",
      "Insert: append, trickle up. Delete: last to root, trickle down.",
      "Trickle down swaps with the larger child, or the heap condition breaks.",
      "A heap is not sorted; searching it for an arbitrary value is O(N)."
     ],
     "widget": "heap",
     "pseudo": "function insert(heap, value):\n    append value to heap\n    i = length(heap) - 1\n    while i > 0 and heap[i] > heap[parent(i)]:\n        swap heap[i], heap[parent(i)]; i = parent(i)\n\nfunction removeMax(heap):\n    top = heap[0]\n    heap[0] = removeLast(heap)\n    i = 0\n    loop:\n        largest = index of the largest of i, left(i), right(i)\n        if largest == i: break\n        swap heap[i], heap[largest]; i = largest\n    return top",
     "costs": [
      [
       "Read max",
       "O(1)",
       "the root"
      ],
      [
       "Insert",
       "O(log N)",
       "trickle up"
      ],
      [
       "Remove max",
       "O(log N)",
       "trickle down"
      ],
      [
       "Search for a value",
       "O(N)",
       "no ordering to follow"
      ],
      [
       "Heap sort",
       "O(N log N)",
       "N removals"
      ]
     ],
     "pitfall": "parent(i) is `(i − 1) / 2` with integer division. Using `i / 2` works for 1-based arrays, not 0-based ones."
    }
   ],
   "ex": "52.1–52.8"
  },
  {
   "ch": 53,
   "title": "Tries",
   "short": "Tries",
   "idea": "A tree of characters: words sharing a prefix share a path, so prefix search costs the prefix length.",
   "topics": [
    {
     "title": "Tries",
     "body": [
      "Each trie node has a map from a character to a child node. Inserting \"pin\" walks or creates root → p → i → n, then marks the end of the word, commonly with a `*` child.",
      "Looking up a word or prefix costs one step per character, O(K) for length K, no matter how many words are stored. \"pin\" and \"pit\" share the p → i path, so common prefixes are stored once.",
      "**Autocomplete** walks to the prefix node, then collects every word below it with a depth-first walk. The **longest shared prefix** is the path from the root down to the first node that branches or ends a word."
     ],
     "model": [
      "Walk one character per level; a missing child means no word has that prefix.",
      "The end marker separates \"pin\" (a word) from \"pi\" (just a prefix).",
      "Collect words with depth-first search, building the string as you descend.",
      "Lookups depend on word length, not on how many words are stored."
     ],
     "widget": "trie",
     "pseudo": "function insert(trie, word):\n    node = trie.root\n    for each ch in word:\n        if ch not in node.children:\n            node.children[ch] = new TrieNode()\n        node = node.children[ch]\n    node.children[\"*\"] = null            // end of word\n\nfunction autocomplete(trie, prefix):\n    node = walk(trie.root, prefix)       // O(K)\n    if node == null: return []\n    return collectWords(node, prefix)    // depth-first below it",
     "costs": [
      [
       "Insert / search a word",
       "O(K)",
       "K = word length"
      ],
      [
       "Check a prefix",
       "O(K)",
       "walk the prefix"
      ],
      [
       "Autocomplete",
       "O(K + output)",
       "walk, then collect"
      ]
     ],
     "pitfall": "Reaching the last character's node does not mean the word exists. Check for the end marker."
    }
   ],
   "ex": "53.1–53.9"
  },
  {
   "ch": 54,
   "title": "Self-balancing trees: red-black trees and treaps",
   "short": "Balanced trees",
   "idea": "Keep a search tree's height logarithmic whatever order the keys arrive in: colour rules, or random priorities.",
   "topics": [
    {
     "title": "Red-black trees",
     "body": [
      "A red-black tree is a BST whose nodes are coloured red or black under four rules: (1) the root is black; (2) empty children (NIL) count as black; (3) a red node has no red children; (4) every path from a node down to a NIL passes the same number of black nodes. Rules 3 and 4 together mean the longest path is at most twice the shortest, so the height stays at most 2 log₂(N + 1).",
      "A **rotation** re-hangs three links around a node, changing the shape but never the sorted order. Insert as in a plain BST, colour the new node red, then repair any red-red violation. If the **uncle** is red, recolour the parent and uncle black and the grandparent red, then repeat higher up. If the uncle is black, rotate (twice for a zig-zag) and recolour; that ends the repair.",
      "Search ignores colour entirely, so lookups are plain BST walks with a guaranteed O(log N). Deletion uses the same toolkit with more cases and at most three rotations."
     ],
     "model": [
      "New nodes start red, so black heights never change on insert; only rule 3 can break.",
      "Red uncle → recolour and move the problem up. Black uncle → rotate and stop.",
      "Rotations are O(1) and preserve in-order order.",
      "Sorted inserts, the worst case for a plain BST, stay logarithmic here."
     ],
     "widget": "rbTree",
     "pseudo": "function insertFixup(tree, z):          // z is the new red node\n    while z.parent is red:\n        g = z.parent.parent; u = uncle of z\n        if u is red:                        // case 1: recolour\n            z.parent.color = black; u.color = black; g.color = red\n            z = g\n        else:\n            if z is an \"inner\" child:       // case 2: zig-zag\n                z = z.parent; rotate z away from g's side\n            z.parent.color = black          // case 3: line\n            g.color = red\n            rotate g the other way\n    tree.root.color = black",
     "costs": [
      [
       "Search",
       "O(log N)",
       "guaranteed"
      ],
      [
       "Insert",
       "O(log N)",
       "≤ 2 rotations"
      ],
      [
       "Delete",
       "O(log N)",
       "≤ 3 rotations"
      ],
      [
       "Height",
       "O(log N)",
       "≤ 2 log₂(N + 1)"
      ]
     ],
     "pitfall": "Forgetting to paint the root black at the end of every insert leaves rule 1 broken after a recolour reaches the top."
    },
    {
     "title": "Treaps",
     "body": [
      "Each treap node gets a random **priority** when it is inserted. The tree is a BST by key and a max-heap by priority: every parent's priority is at least its children's. For a given set of keys and priorities there is exactly one such tree.",
      "That tree is the BST you would get by inserting the keys in priority order, highest first. Since priorities are random, that is a **random insertion order**, and random BSTs have expected depth O(log N). The keys can arrive sorted; the priorities ignore that.",
      "Insert as a BST leaf, then rotate the new node up while its priority beats its parent's. Delete by rotating the node down, always lifting the child with the higher priority, until it is a leaf, then cut it off. **Split** and **merge** handle whole key ranges in O(log N)."
     ],
     "model": [
      "Two orders at once: keys left to right, priorities top to bottom.",
      "Insert: BST leaf, then rotate up while it outranks its parent.",
      "No colours, no cases: one random number per node does the balancing.",
      "Expected height ≈ 3 log₂ N; bad shapes are possible but astronomically unlikely."
     ],
     "widget": "treap",
     "pseudo": "function insert(node, key):\n    if node == null: return new Node(key, priority = random())\n    if key < node.key:\n        node.left = insert(node.left, key)\n        if node.left.priority > node.priority: node = rotateRight(node)\n    else if key > node.key:\n        node.right = insert(node.right, key)\n        if node.right.priority > node.priority: node = rotateLeft(node)\n    return node",
     "costs": [
      [
       "Search / insert / delete",
       "O(log N)",
       "expected"
      ],
      [
       "Split / merge",
       "O(log N)",
       "expected"
      ],
      [
       "Worst case",
       "O(N)",
       "needs extraordinary bad luck"
      ],
      [
       "Extra space per node",
       "O(1)",
       "one priority"
      ]
     ],
     "pitfall": "Rotating a child up must also return the new subtree root to the parent's link. Dropping the return value detaches part of the tree."
    }
   ],
   "ex": "54.1–54.15"
  },
  {
   "ch": 55,
   "title": "B-trees and block storage",
   "short": "B-trees",
   "idea": "On disk, reading a block costs far more than computing on it, so make each node one block holding many keys.",
   "topics": [
    {
     "title": "B-trees",
     "body": [
      "In the **external-memory model** data moves between disk and memory in blocks of B items, and only those transfers (I/Os) count. Scanning N items costs about N/B I/Os; jumping around costs one I/O per item. A binary tree on disk needs log₂ N reads per lookup: 30 for a billion keys.",
      "A **B-tree** of minimum degree t stores between t − 1 and 2t − 1 sorted keys in each node (the root may have fewer), and a node with k keys has k + 1 children. With nodes sized to a block, t is in the hundreds, so the height is about log_t N: a billion keys fit in 3 or 4 levels. Every leaf is at the same depth.",
      "Insertion splits full nodes on the way down: the middle key moves up into the parent and the node becomes two. The tree grows only by splitting the root, which is how it stays perfectly balanced. Keys are sorted, so range queries walk neighbouring nodes. That is why databases and file systems index with B-trees."
     ],
     "model": [
      "Count I/Os: one node read = one block transfer.",
      "Fat nodes mean a shallow tree: height ≈ log_t N.",
      "Split full nodes before entering them, so a leaf always has room.",
      "All leaves at one depth: growth happens only at the root."
     ],
     "widget": "btree",
     "pseudo": "function insert(tree, key):\n    if tree.root is full:                     // 2t - 1 keys\n        newRoot = node with child tree.root\n        splitChild(newRoot, 0); tree.root = newRoot\n    node = tree.root\n    while node is not a leaf:\n        i = first index with node.keys[i] >= key\n        if node.children[i] is full:\n            splitChild(node, i)               // middle key moves up\n            if key > node.keys[i]: i = i + 1\n        node = node.children[i]\n    insert key into node.keys in sorted position",
     "costs": [
      [
       "Search",
       "O(log_t N)",
       "I/Os: one node per level"
      ],
      [
       "Insert / delete",
       "O(log_t N)",
       "I/Os, plus O(t) CPU per node"
      ],
      [
       "Range query, K results",
       "O(log_t N + K/t)",
       "neighbouring leaves"
      ],
      [
       "Binary tree on disk",
       "O(log N)",
       "log₂ N I/Os: far more"
      ]
     ],
     "pitfall": "Splitting after inserting (bottom-up) can cascade back up the tree. Proactive splitting on the way down needs only one pass."
    }
   ],
   "ex": "55.1–55.9"
  },
  {
   "ch": 61,
   "title": "Graphs: representation and traversal",
   "short": "Graph traversal",
   "idea": "Vertices joined by edges model any network; depth-first and breadth-first search visit it in O(V + E).",
   "topics": [
    {
     "title": "Graphs: representation and traversal",
     "body": [
      "A graph is a set of **vertices** connected by **edges**. Edges can be directed (one way) and weighted (a cost or distance). Store it as an adjacency list: each vertex maps to its neighbours.",
      "**Depth-first search** follows one path as far as it can, then backtracks, using recursion or a stack. **Breadth-first search** visits all neighbours first, then their neighbours, using a queue; in an unweighted graph that finds the path with the fewest edges. Both keep a **visited** set so cycles do not loop forever, and both take O(V + E).",
      "An **adjacency list** stores only the edges that exist, O(V + E) space. An **adjacency matrix** answers \"is there an edge from a to b?\" in O(1) but takes V² space, so it suits small or dense graphs."
     ],
     "model": [
      "DFS: stack or recursion, goes deep. BFS: queue, goes wide.",
      "Mark a vertex visited when you first reach it, or cycles revisit it forever.",
      "BFS reaches vertices in order of distance; DFS reaches them in order of discovery along one path.",
      "Lists for sparse graphs, a matrix for dense ones or constant-time edge checks."
     ],
     "widget": "graph",
     "pseudo": "function bfs(graph, start):\n    visited = { start }; queue = [ start ]\n    while queue is not empty:\n        v = dequeue(queue)\n        for each n in graph[v]:\n            if n not in visited:\n                add n to visited; enqueue(queue, n)\n\nfunction dfs(graph, v, visited):\n    add v to visited\n    for each n in graph[v]:\n        if n not in visited: dfs(graph, n, visited)",
     "costs": [
      [
       "DFS / BFS",
       "O(V + E)",
       "each vertex and edge once"
      ],
      [
       "Adjacency list space",
       "O(V + E)",
       "only edges that exist"
      ],
      [
       "Adjacency matrix space",
       "O(V^2)",
       "every possible pair"
      ],
      [
       "Edge check in a matrix",
       "O(1)",
       "one lookup"
      ]
     ],
     "pitfall": "Mark a vertex visited when you first reach it, not when you leave it; otherwise a vertex reachable two ways is queued twice."
    }
   ],
   "ex": "61.1–61.6"
  },
  {
   "ch": 62,
   "title": "Shortest paths and ordering",
   "short": "Paths and order",
   "idea": "Fewest hops with breadth-first search, lowest cost with Dijkstra's algorithm, and an order that respects every dependency.",
   "topics": [
    {
     "title": "Shortest paths and ordering",
     "body": [
      "In an unweighted graph, **breadth-first search** reaches vertices in order of distance, so the first time it reaches the target it has found a path with the fewest edges. Remember each vertex's parent to rebuild the path.",
      "**Dijkstra's algorithm** finds the lowest-cost route when edges have non-negative weights, such as travel minutes. Keep the best known cost to each vertex. Repeatedly settle the unsettled vertex with the lowest cost, and see whether going through it improves its neighbours.",
      "A **topological order** lists tasks so that each one comes after the tasks it depends on. Repeatedly take a task with no remaining prerequisites; if tasks remain but none is free, the dependencies contain a cycle and no order exists."
     ],
     "model": [
      "BFS distance = fewest edges; Dijkstra cost = lowest total weight.",
      "With a heap, Dijkstra runs in O((V + E) log V).",
      "A heap entry goes stale when a cheaper path appears later: skip it when it comes out.",
      "No free task while tasks remain means a cycle."
     ],
     "widget": "paths",
     "pseudo": "function dijkstra(graph, start):\n    cost = { start: 0 }; heap = [ (0, start) ]; done = {}\n    while heap is not empty:\n        (c, v) = popMin(heap)\n        if v in done: continue\n        add v to done\n        for each (n, w) in graph[v]:\n            if n not in cost or c + w < cost[n]:\n                cost[n] = c + w; push(heap, (c + w, n))\n    return cost\n\nfunction topologicalOrder(deps):\n    waiting = number of prerequisites of each task\n    ready = tasks with none; order = []\n    while ready is not empty:\n        t = take from ready; append t to order\n        for each task u that depends on t:\n            waiting[u] -= 1\n            if waiting[u] == 0: add u to ready\n    return order if it holds every task, else none   // a cycle",
     "costs": [
      [
       "Shortest path, unweighted (BFS)",
       "O(V + E)",
       "fewest edges"
      ],
      [
       "Dijkstra with a heap",
       "O((V + E) log V)",
       "non-negative weights"
      ],
      [
       "Topological order",
       "O(V + E)",
       "each dependency once"
      ]
     ],
     "pitfall": "Dijkstra breaks with negative edge weights: a vertex marked done might later get cheaper. Negative weights need Bellman–Ford."
    }
   ],
   "ex": "62.1–62.3"
  },
  {
   "ch": 71,
   "title": "Recursion",
   "short": "Recursion",
   "idea": "Solve a problem through a smaller copy of itself, then build the answer on the way back.",
   "topics": [
    {
     "title": "Base cases and the call stack",
     "body": [
      "Every recursive function needs a **base case** that returns without recursing, and a recursive case that moves closer to it. Without the base case the calls never stop.",
      "Each call waits for the one it made. The computer tracks the waiting calls on the **call stack**: push a frame per call, pop it when the call returns. Too many waiting calls exhausts the stack, a stack overflow.",
      "To read recursive code, start at the base case and work upwards: factorial(1) is 1, so factorial(2) is 2 × 1, factorial(3) is 3 × 2, and so on."
     ],
     "model": [
      "Base case first: what input needs no further calls?",
      "Each recursive call must shrink the problem.",
      "The call stack holds one frame per unfinished call, so depth costs memory.",
      "Recursion shines on arbitrary depth, like teams inside teams in an org chart, where loops get awkward."
     ],
     "widget": "callStack",
     "pseudo": "function factorial(n):\n    if n <= 1: return 1               // base case\n    return n * factorial(n - 1)       // smaller problem\n\nfunction visit(folder):              // arbitrary depth\n    for each entry in folder:\n        if entry is a folder:\n            print entry.name\n            visit(entry)",
     "costs": [
      [
       "factorial(n) time",
       "O(N)",
       "N calls"
      ],
      [
       "factorial(n) stack space",
       "O(N)",
       "N frames wait at once"
      ],
      [
       "Fast power (halve the exponent)",
       "O(log N)",
       "x^n from x^(n/2)"
      ]
     ],
     "pitfall": "A base case that is never reached (e.g. `n == 0` when n can go negative) is as bad as none at all."
    },
    {
     "title": "Thinking top-down",
     "body": [
      "Bottom-up thinking traces every call. **Top-down** thinking skips that: imagine the function already works for a smaller input. What is the subproblem, and what do you do with its answer?",
      "`sum(list)` is the first item plus `sum(rest)`. `digitSum(n)` is the last digit plus `digitSum(n / 10)`. Counting the ways to tile a path with tiles of length 1 and 3 is `ways(N−1) + ways(N−3)`: the first tile is short or long.",
      "Some problems branch. Each call makes several calls, producing a tree of calls: all subsets (2ᴺ leaves) or every balanced string of brackets. The tree's size is the running time."
     ],
     "model": [
      "Step 1: name the subproblem. Step 2: assume it is solved. Step 3: combine.",
      "Pass an index or extra parameter to avoid copying arrays on every call.",
      "One call per level is a chain; several calls per level are a tree, often exponential.",
      "For subsets, each item is either in or out: two branches per item."
     ],
     "widget": "subsetsTree",
     "pseudo": "function subsets(items):\n    if items is empty: return [ [] ]\n    rest = subsets(items without first)       // assume this works\n    withFirst = [ [first] + s for each s in rest ]\n    return rest + withFirst\n\nfunction ways(n):                        // tile a path with 1- and 3-long tiles\n    if n < 0: return 0\n    if n == 0: return 1\n    return ways(n - 1) + ways(n - 3)",
     "costs": [
      [
       "Linear recursion (sum, digit sum)",
       "O(N)",
       "one call per item"
      ],
      [
       "All subsets",
       "O(2^N)",
       "two branches per item"
      ],
      [
       "All orderings of N items",
       "O(N!)",
       "N choices, then N − 1, …"
      ],
      [
       "Tilings with 1- and 3-long tiles, naive",
       "O(1.47^N)",
       "two overlapping branches"
      ]
     ],
     "pitfall": "Slicing a fresh copy of the array on every call silently turns O(N) recursion into O(N²) time and memory. Pass an index instead."
    }
   ],
   "ex": "71.1–71.18"
  },
  {
   "ch": 72,
   "title": "Dynamic programming",
   "short": "Dynamic programming",
   "idea": "When a recursion keeps re-solving the same subproblems, solve each one once.",
   "topics": [
    {
     "title": "Dynamic programming",
     "body": [
      "Naive `fib(n)` calls `fib(n−1)` and `fib(n−2)`, and each of those repeats the work below it. The call tree roughly doubles at each level, so the time is exponential. The subproblems **overlap**.",
      "**Memoization** keeps the recursion but stores every answer in a map. Before computing, check the map. Each distinct subproblem is now solved once, so `fib(n)` takes O(N).",
      "**Bottom-up** drops the recursion: start from the smallest cases and loop upwards, keeping only what you need. Same O(N) time, no call stack, often O(1) extra space."
     ],
     "model": [
      "Ask: do the same arguments come up again and again? Then memoize.",
      "Memo key = the arguments that define the subproblem.",
      "Bottom-up fills a table in the order dependencies need.",
      "A cheaper fix sometimes: call the recursive function once and store its result in a variable."
     ],
     "widget": "fibTree",
     "pseudo": "function fib(n, memo):\n    if n <= 1: return n\n    if n not in memo:\n        memo[n] = fib(n - 1, memo) + fib(n - 2, memo)\n    return memo[n]\n\nfunction fibBottomUp(n):\n    if n <= 1: return n\n    a = 0; b = 1\n    repeat n - 1 times:\n        a, b = b, a + b\n    return b",
     "costs": [
      [
       "fib, naive recursion",
       "O(2^N)",
       "overlapping subproblems"
      ],
      [
       "fib, memoized",
       "O(N)",
       "each n solved once"
      ],
      [
       "fib, bottom-up",
       "O(N)",
       "O(1) extra space"
      ],
      [
       "Fewest coins, bottom-up",
       "O(N × C)",
       "amount × coin types"
      ]
     ],
     "pitfall": "A memo that is re-created on every call (a fresh empty map inside the function) memoizes nothing. Pass one map down, or keep it outside."
    }
   ],
   "ex": "72.1–72.6"
  },
  {
   "ch": 73,
   "title": "Greedy choices and problem transforms",
   "short": "Greedy and transforms",
   "idea": "Aim for the lower bound, then reach it with a lookup table, a sliding window, a greedy rule or a precomputed summary.",
   "topics": [
    {
     "title": "Greedy choices and problem transforms",
     "body": [
      "Start from the **lower bound**: if every item has to be looked at, nothing beats O(N), so an O(N) solution is the goal. If your code is O(N²), ask what forces the inner loop to exist.",
      "Four reliable moves. **Remember what you have seen** in a set or table, so a later item finds its partner in O(1) (a pair with a given difference). **Slide a window** when the answer is a contiguous run: grow one end, shrink the other. **Be greedy** when a local rule can never hurt: take the meeting that ends first, keep the furthest index you can reach. **Precompute a summary**, such as running totals or buckets of counts, so each later question is O(1).",
      "Greedy rules are fast but not always correct: compare them with a brute-force answer on small inputs, and look for a reason the local choice is always safe."
     ],
     "model": [
      "Write down the brute-force Big O and the lower bound first.",
      "\"If only I could find this instantly\" means a set or a hash table.",
      "A window works when shrinking it can only lower the sum or count.",
      "Counts are at most N, so they can be bucketed instead of sorted, in O(N)."
     ],
     "widget": "twoSum",
     "pseudo": "function hasPairWithDifference(nums, d):   // O(N) with a set\n    seen = empty set\n    for each x in nums:\n        if x + d in seen or x - d in seen: return true\n        add x to seen\n    return false\n\nfunction maxMeetings(meetings):              // greedy: earliest end first\n    sort meetings by end time\n    count = 0; lastEnd = -infinity\n    for each (start, end) in meetings:\n        if start >= lastEnd: count += 1; lastEnd = end\n    return count",
     "costs": [
      [
       "Pair with a difference, nested loops",
       "O(N^2)",
       "every pair"
      ],
      [
       "Pair with a difference, set",
       "O(N)",
       "one pass"
      ],
      [
       "Window with a target sum",
       "O(N)",
       "each index enters and leaves once"
      ],
      [
       "Range total after prefix sums",
       "O(1)",
       "per query, after O(N) setup"
      ]
     ],
     "pitfall": "Look up first, then add. Adding the current item to the table before checking it lets an item pair with itself."
    }
   ],
   "ex": "73.1–73.9"
  },
  {
   "ch": 74,
   "title": "Randomized algorithms",
   "short": "Randomized",
   "idea": "Use randomness to shuffle, sample, balance and estimate, and to test primes fast with a tiny chance of error.",
   "topics": [
    {
     "title": "Randomness as a tool",
     "body": [
      "Computers generate **pseudo-random** numbers with a deterministic formula: a linear congruential generator computes `x = (a·x + c) mod m` from a **seed**. The same seed always gives the same sequence. That makes tests reproducible, and it is also why such generators are not secure.",
      "A fair shuffle must make all N! orders equally likely. **Fisher–Yates** does it: for i from the end down, swap item i with a random item in 0..i. The tempting \"swap each item with any position\" has Nᴺ equally likely outcomes, which cannot divide evenly among N! orders, so some orders come up more often.",
      "Randomness also defends against bad inputs. A random pivot gives quicksort expected O(N log N) on **every** input. Shuffling keys before building a BST gives expected height O(log N). Sending each job to the less busy of **two** random servers keeps the busiest server's load dramatically lower."
     ],
     "model": [
      "Seeded PRNG: deterministic and reproducible, but not unpredictable.",
      "Fisher–Yates: random index from 0..i inclusive, walking i downwards.",
      "Randomized algorithms have no bad inputs, only (rare) bad luck.",
      "Reservoir sampling picks k items uniformly from a stream of unknown length."
     ],
     "widget": "shuffleBias",
     "pseudo": "function fisherYates(arr, rng):\n    for i from length(arr) - 1 down to 1:\n        j = rng.integer(0, i)            // inclusive of i\n        swap arr[i], arr[j]\n\nfunction naiveShuffle(arr, rng):        // biased: do not use\n    for i from 0 to length(arr) - 1:\n        j = rng.integer(0, length(arr) - 1)\n        swap arr[i], arr[j]",
     "costs": [
      [
       "Fisher–Yates shuffle",
       "O(N)",
       "uniform over N! orders"
      ],
      [
       "Randomized quicksort (expected)",
       "O(N log N)",
       "on every input"
      ],
      [
       "Reservoir sample of k",
       "O(N)",
       "O(k) memory"
      ],
      [
       "Weighted pick (prefix sums)",
       "O(log N)",
       "binary search per pick"
      ]
     ],
     "pitfall": "Picking `j` from 0..i−1 (excluding i) looks harmless, but it forbids leaving an item in place and rules out many orders."
    },
    {
     "title": "Monte Carlo and Las Vegas algorithms",
     "body": [
      "A **Las Vegas** algorithm is always right but its running time is random (randomized quicksort). A **Monte Carlo** algorithm has a fixed running time but can be wrong with small probability. Repeating it independently shrinks that probability exponentially.",
      "**Estimating π**: throw random darts at a unit square; the fraction inside the quarter circle approaches π/4. The error shrinks like 1/√S: 100 times more samples buy one more digit. Sampling estimates averages over huge data the same way, at a cost that depends on the sample size, not N.",
      "**Primality**: if n is prime, then a^(n−1) mod n = 1 for every a not divisible by n (Fermat). A base that fails proves n composite. Carmichael numbers like 561 pass for every coprime base, so **Miller–Rabin** strengthens the check. Each random base catches a composite with probability at least 3/4; 20 bases leave an error below 1 in a trillion. A fixed set of 12 bases is exact for every 64-bit number."
     ],
     "model": [
      "Monte Carlo: fixed time, maybe wrong. Las Vegas: always right, random time.",
      "Repeat k times: error goes from p to pᵏ.",
      "Sampling error ∝ 1/√samples, independent of the data size.",
      "\"Composite\" from a primality test is certain; \"prime\" is probable."
     ],
     "widget": "darts",
     "pseudo": "function estimatePi(samples, rng):\n    inside = 0\n    repeat samples times:\n        x = rng.unit(); y = rng.unit()\n        if x*x + y*y <= 1: inside = inside + 1\n    return 4 * inside / samples\n\nfunction probablyPrime(n, k, rng):     // Fermat test\n    repeat k times:\n        a = rng.integer(2, n - 2)\n        if powMod(a, n - 1, n) != 1: return false   // certainly composite\n    return true                                     // probably prime",
     "costs": [
      [
       "Estimate π with S samples",
       "O(S)",
       "error ~ 1/√S"
      ],
      [
       "Trial division",
       "O(√N)",
       "exponential in the digits"
      ],
      [
       "Fermat / Miller–Rabin, k bases",
       "O(k log N)",
       "multiplications"
      ],
      [
       "Las Vegas search for a 1",
       "O(1)",
       "expected 2 probes"
      ]
     ],
     "pitfall": "`a * b mod n` overflows 64 bits once n passes about 3 × 10⁹. Use 128-bit multiplication or big integers inside powMod."
    }
   ],
   "ex": "74.1–74.17"
  },
  {
   "ch": 81,
   "title": "Caching and eviction",
   "short": "Caching",
   "idea": "Keep recently used data close; when the cache is full, the eviction policy decides your hit rate.",
   "topics": [
    {
     "title": "Caching",
     "body": [
      "Memory is a hierarchy: registers, CPU caches, RAM, disk, network, each much bigger and much slower than the last. A **cache** keeps a small, fast copy of data you are likely to need again. A **hit** is cheap; a **miss** pays the slow path.",
      "When the cache is full, something must go. **LRU** (least recently used) evicts the key untouched for longest, betting that the recent past predicts the near future. A hash map from key to node plus a doubly linked list ordered by recency makes every operation O(1). **FIFO** evicts the oldest insert regardless of use; **random** eviction needs no bookkeeping at all.",
      "No policy wins everywhere. Cycling through capacity + 1 keys makes LRU miss **every** time, because it always evicts the key needed next. Random eviction keeps most hits on that pattern. Hardware caches reward **locality**: walk a 2-D array row by row, in memory order."
     ],
     "model": [
      "Hit rate = hits ÷ requests; that number is what a policy optimizes.",
      "LRU = hash map (find the node) + linked list (move it to the front in O(1)).",
      "Temporal locality: reuse soon. Spatial locality: use neighbours.",
      "Memoization is a cache of function results; bound its size with LRU."
     ],
     "widget": "cacheSim",
     "pseudo": "function get(cache, key):\n    if key not in cache.map: return miss\n    node = cache.map[key]\n    move node to the front of cache.list     // now most recent\n    return node.value\n\nfunction put(cache, key, value):\n    if key in cache.map: update it, move to front; return\n    insert a new node at the front; cache.map[key] = node\n    if size > capacity:\n        lru = cache.list.back                 // least recently used\n        remove lru from list and map",
     "costs": [
      [
       "LRU get / put",
       "O(1)",
       "map + doubly linked list"
      ],
      [
       "FIFO get / put",
       "O(1)",
       "queue of insertion order"
      ],
      [
       "Random eviction",
       "O(1)",
       "swap-remove from an array"
      ],
      [
       "Row-first vs column-first walk",
       "O(R × C)",
       "same steps, different speed"
      ]
     ],
     "pitfall": "Updating an existing key must also move it to the front. Otherwise it gets evicted as if it were stale."
    }
   ],
   "ex": "81.1–81.8"
  },
  {
   "ch": 82,
   "title": "External memory: sorting data bigger than RAM",
   "short": "External sort",
   "idea": "Sort data bigger than memory by sorting memory-sized runs, then merging as many runs at once as memory allows.",
   "topics": [
    {
     "title": "External sort",
     "body": [
      "Suppose memory holds M items and disk moves B items per I/O. **Pass 0** reads M items at a time, sorts them in memory, and writes each as a sorted **run**: N/M runs.",
      "Then merge. A two-way merge halves the number of runs per pass. But memory has room for M/B blocks, so keep one input block per run plus one output block and merge **M/B − 1** runs at once, using a min-heap to pick the smallest front value. Wider merges mean far fewer passes.",
      "Every pass reads and writes all the data, 2N/B I/Os. The total is about (2N/B) · (1 + log base (M/B − 1) of N/M), which is optimal for sorting in external memory. For realistic sizes that is just two or three passes, even for terabytes."
     ],
     "model": [
      "Pass 0 makes runs; every later pass merges runs.",
      "Fan-in = M/B − 1: one block per input run, one for output.",
      "Passes = 1 + ceil(log_fanIn(N/M)); I/Os = passes × 2N/B.",
      "A k-way merge with a heap costs O(log k) per item."
     ],
     "widget": "extSort",
     "pseudo": "function externalSort(file, M, B):\n    runs = []\n    while file has data:                        // pass 0\n        chunk = read next M items; sort chunk in memory\n        write chunk to a new run file; add it to runs\n    fanIn = M / B - 1\n    while length(runs) > 1:                     // merge passes\n        runs = [ kWayMerge(group) for each group of fanIn runs ]\n    return runs[0]\n\nfunction kWayMerge(runs):\n    heap = min-heap of (first value, run) for each run\n    while heap is not empty:\n        (v, r) = popMin(heap); write v\n        if r has another value: push (next value of r, r)",
     "costs": [
      [
       "Pass 0 (make runs)",
       "O(N log M)",
       "CPU; 2N/B I/Os"
      ],
      [
       "k-way merge of N items",
       "O(N log k)",
       "heap of k fronts"
      ],
      [
       "Passes",
       "O(log N)",
       "base M/B − 1, so usually 2–3"
      ],
      [
       "Total I/Os",
       "O((N/B) log N)",
       "log base M/B: optimal"
      ]
     ],
     "pitfall": "A two-way merge wastes memory: with room for 100 blocks it still reads only 2 runs at a time, and needs many more passes over the disk."
    }
   ],
   "ex": "82.1–82.7"
  },
  {
   "ch": 83,
   "title": "Compact sets: bit vectors and Bloom filters",
   "short": "Compact sets",
   "idea": "Store a set in one bit per possible member, or approximately in far less with a Bloom filter.",
   "topics": [
    {
     "title": "Bit vectors",
     "body": [
      "If the values are integers in 0..U−1, a set needs only U bits: bit x is 1 when x is a member. That is U/8 bytes. A hash set of the same numbers needs tens of bytes per member, so the bit vector can be over a hundred times smaller.",
      "Bits live in machine words of 64. Value x is in word `x >> 6` (x divided by 64) at bit `x & 63` (x mod 64). Build a mask `1 << bit`: **OR** it in to add, **AND NOT** to remove, **AND** to test.",
      "Set algebra is word-at-a-time: union is OR, intersection is AND, difference is AND NOT, 64 members per instruction. Counting members uses popcount, a single CPU instruction. Iterating members peels off the lowest set bit with `w & (w − 1)`."
     ],
     "model": [
      "word = x >> 6, bit = x & 63, mask = 1 << bit.",
      "Add: OR. Remove: AND NOT. Test: AND, then compare with 0.",
      "Space is U/8 bytes no matter how many members.",
      "Best when the universe is dense-ish and bounded; a hash set wins for a few huge values."
     ],
     "widget": "bitVector",
     "pseudo": "function add(bits, x):       bits[x >> 6] = bits[x >> 6] OR (1 << (x AND 63))\nfunction remove(bits, x):    bits[x >> 6] = bits[x >> 6] AND NOT (1 << (x AND 63))\nfunction contains(bits, x):  return (bits[x >> 6] >> (x AND 63)) AND 1 == 1\n\nfunction union(a, b):\n    out = new bit array\n    for w from 0 to length(a) - 1: out[w] = a[w] OR b[w]\n    return out",
     "costs": [
      [
       "Add / remove / test",
       "O(1)",
       "one word"
      ],
      [
       "Union / intersection",
       "O(U/64)",
       "word at a time"
      ],
      [
       "Count members",
       "O(U/64)",
       "popcount per word"
      ],
      [
       "Space",
       "O(U)",
       "bits: U/8 bytes"
      ]
     ],
     "pitfall": "The mask must be built in a 64-bit type. In some languages `1 << 40` on a 32-bit int wraps and silently sets the wrong bit."
    },
    {
     "title": "Bloom filters",
     "body": [
      "A Bloom filter is an array of m bits plus k hash functions. **Add** sets the k bits an item hashes to. **Query** checks those k bits: if any is 0 the item was never added (certain); if all are 1 it **probably** was, since other items may have set those bits.",
      "After n items, the chance that a never-added item looks present is about (1 − e^(−kn/m))^k. The best k is (m/n)·ln 2, and the bits needed for a target rate p are m = −n·ln p / (ln 2)²: about **9.6 bits per item for 1%**, about 4.8 more bits per item for each further tenfold cut, no matter how big the items are.",
      "In practice two hashes are enough: positions `h₁ + i·h₂ mod m` behave like k independent hashes. Filters built with the same m and k combine by OR. Plain filters cannot delete; a counting filter keeps small counters instead of bits."
     ],
     "model": [
      "No false negatives; false positives at a rate you set.",
      "k too small: few bits checked. k too large: the array fills up. Optimum k = (m/n) ln 2.",
      "≈ 9.6 bits per item for 1% error.",
      "Use it as a cheap guard in front of an expensive exact lookup."
     ],
     "widget": "bloomCalc",
     "pseudo": "function positions(item, k, m):\n    (h1, h2) = two hashes of item\n    return [ (h1 + i * h2) mod m for i from 0 to k - 1 ]\n\nfunction add(filter, item):\n    for each p in positions(item, filter.k, filter.m): filter.bits[p] = 1\n\nfunction mightContain(filter, item):\n    for each p in positions(item, filter.k, filter.m):\n        if filter.bits[p] == 0: return false      // definitely not\n    return true                                   // probably",
     "costs": [
      [
       "Add / query",
       "O(k)",
       "k bit positions"
      ],
      [
       "Space",
       "O(n)",
       "≈ 9.6 bits per item at 1%"
      ],
      [
       "Union of two filters",
       "O(m/64)",
       "OR the words"
      ],
      [
       "Delete (counting filter)",
       "O(k)",
       "counters instead of bits"
      ]
     ],
     "pitfall": "A Bloom filter fills up. Insert far more than the n it was sized for and the false-positive rate climbs towards 100%."
    }
   ],
   "ex": "83.1–83.17"
  }
 ],
 "summaries": [
  {
   "title": "Choosing a structure",
   "focus": "Sequences, hashing, trees and graphs on one table.",
   "cols": [
    "Read",
    "Search",
    "Insert",
    "Delete",
    "Best for"
   ],
   "rows": [
    [
     "Array",
     "O(1)",
     "O(N)",
     "O(N)",
     "O(N)",
     "index access, appending"
    ],
    [
     "Ordered array",
     "O(1)",
     "O(log N)",
     "O(N)",
     "O(N)",
     "many searches, few changes"
    ],
    [
     "Hash table",
     "O(1)",
     "O(1)",
     "O(1)",
     "O(1)",
     "lookup by key, counting, sets"
    ],
    [
     "Stack / queue",
     "O(1)",
     "O(N)",
     "O(1)",
     "O(1)",
     "ordering work: undo, scheduling"
    ],
    [
     "Linked list",
     "O(N)",
     "O(N)",
     "O(1)",
     "O(1)",
     "fast ends, splicing while walking"
    ],
    [
     "Binary search tree",
     "O(log N)",
     "O(log N)",
     "O(log N)",
     "O(log N)",
     "sorted data that keeps changing"
    ],
    [
     "Heap",
     "O(1)",
     "O(N)",
     "O(log N)",
     "O(log N)",
     "always taking the top priority"
    ],
    [
     "Trie",
     "O(K)",
     "O(K)",
     "O(K)",
     "O(K)",
     "prefixes and autocomplete"
    ]
   ],
   "note": "Linked-list insert and delete are O(1) once you are at the node, at the head, or at a tracked tail. BST costs assume a balanced tree. Heap read is for the maximum only. Trie costs are per word of length K."
  },
  {
   "title": "Beyond step counting",
   "focus": "Timing, memory, randomness, balanced trees and storage on one table.",
   "cols": [
    "Search",
    "Insert",
    "Delete",
    "Space",
    "Guarantee"
   ],
   "rows": [
    [
     "Plain BST (Chapter 51)",
     "O(N)",
     "O(N)",
     "O(N)",
     "O(N)",
     "worst case on sorted input"
    ],
    [
     "Red-black tree",
     "O(log N)",
     "O(log N)",
     "O(log N)",
     "O(N)",
     "guaranteed by colour rules"
    ],
    [
     "Treap",
     "O(log N)",
     "O(log N)",
     "O(log N)",
     "O(N)",
     "expected, by random priorities"
    ],
    [
     "B-tree (I/Os)",
     "O(log_t N)",
     "O(log_t N)",
     "O(log_t N)",
     "O(N)",
     "guaranteed; one block per node"
    ],
    [
     "Universal hash table",
     "O(1)",
     "O(1)",
     "O(1)",
     "O(N)",
     "expected, on any keys"
    ],
    [
     "Bit vector",
     "O(1)",
     "O(1)",
     "O(1)",
     "O(U)",
     "exact; U/8 bytes"
    ],
    [
     "Bloom filter",
     "O(k)",
     "O(k)",
     "n/a",
     "O(n)",
     "false positives at rate p"
    ]
   ],
   "note": "Space is in machine words except for the bit vector (U bits for values 0..U−1) and the Bloom filter (about 9.6 bits per item at 1% error)."
  }
 ]
};
