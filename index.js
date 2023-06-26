import { Minhash, LshIndex } from "minhash";
import * as fs from "fs";

// add each document to a Locality Sensitive Hashing index
var index = new LshIndex();

let shingleMinLength = 5;
var shingleSeparators = [
  ":",
  "\n",
  "\\",
  "/",
  '"',
  ",",
  " ",
  "/",
  "<",
  ">",
  ";",
]; // '.',

let resources = [
  { url: "https://spoggy-test2.solidcommunity.net/" },
  { url: "https://spoggy-test2.solidcommunity.net/public/" },
  { url: "https://spoggy-test2.solidcommunity.net/public/bookmarks/" },
  { url: "https://spoggy-test2.solidcommunity.net/profile/card#me" },
];

let searching = {
  url: "https://spoggy-test3.solidcommunity.net/profile/card#me",
};

// import * as dotenv from "dotenv";
// dotenv.config();

export const run = async () => {
  for await (let r of resources) {
    r = await getContent(r);
    r.mini = addToMinhash(r);
  }

  //console.log("resources", JSON.stringify(resources, null, 2));

  await search();
};

run();

async function search() {
  console.log("searching", searching);
  let r = searching;
  r = await getContent(r);
  r.mini = addToMinhash(r);
  var matches = index.query(r.mini);
  console.log("Jaccard similarity >= 0.5 to search.url:", matches);

  resources.forEach((res) => {
    let jac = r.mini.jaccard(res.mini);
    console.log(res.url, jac);
  });
}

function addToMinhash(r) {
  var m = new Minhash();
  r.shingles.map(function (w) {
    m.update(w);
  });
  index.insert(r.url, m);
  console.log(index);
  fs.writeFile(
    "./index/index_" + Date.now,
    JSON.stringify(index, null, 2),
    (err) => {
      if (err) {
        console.error(err);
      }
      // fichier écrit avec succès
    }
  );
  console.log("### inserted : ", r.url);
  return m;
}

async function getContent(r) {
  console.log("get content", r.url);
  let response = await fetch(r.url, {
    method: "GET",
    headers: {
      // Accept: "application/ld+json",
    },
  });
  //r.content = await response.json();

  r.text = await response.text();
  r.shingles = r.text.split(new RegExp(shingleSeparators.join("|"), "g"));
  r.shingles = r.shingles.map((s) => s.trim());
  r.shingles = [...new Set(r.shingles)]; // remove duplicate

  r.shingles = r.shingles.filter((s) => s.length > shingleMinLength);

  //.split("/");
  return r;
}

// export const run = async () => {
//     resources.forEach((r) => {
//         console.log("get content", r.url);
//       let response = await fetch(r.url, {
//           method: 'GET',
//           headers: {
//               'Accept': 'application/json',
//           },
//       })
//       console.log(response)
// }

// }

// run();

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
