import { Minhash } from "minhash"; // If using Node.js

var s1 = [
  "minhash",
  "is",
  "a",
  "probabilistic",
  "data",
  "structure",
  "for",
  "estimating",
  "the",
  "similarity",
  "between",
  "datasets",
];
var s2 = [
  "minhash",
  "is",
  "a",
  "probability",
  "data",
  "structure",
  "for",
  "estimating",
  "the",
  "similarity",
  "between",
  "documents",
];

// create a hash for each set of words to compare
var m1 = new Minhash();
var m2 = new Minhash();

// update each hash
s1.map(function (w) {
  m1.update(w);
});
s2.map(function (w) {
  m2.update(w);
});

// estimate the jaccard similarity between two minhashes
let sim = m1.jaccard(m2);
console.log(sim);
