import react from "react";

export default function countAllocations(alloc) {
    let count = 0;
    for (let i = 0; i < alloc.length; i++) {
        for (let j = 0; j < alloc[0].length; j++) {
            if (alloc[i][j] > 0) count++;
        }
    }
    return count;
}