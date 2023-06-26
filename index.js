import { Minhash, LshIndex } from "minhash";
import * as fs from "fs";
import Converter from "./src/converter.cjs";

let converter = new Converter();
// add each document to a Locality Sensitive Hashing index
var index = new LshIndex();
let indexed = { start: Date.now(), end: null, resources: {} };

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
  //
  { url: "https://spoggy-test4.solidcommunity.net/" },
  { url: "https://spoggy-test4.solidcommunity.net/public/" },
  { url: "https://spoggy-test4.solidcommunity.net/public/bookmarks/" },
  { url: "https://spoggy-test4.solidcommunity.net/profile/card#me" },
  //
  { url: "https://spoggy-test5.solidcommunity.net/" },
  { url: "https://spoggy-test5.solidcommunity.net/public/" },
  { url: "https://spoggy-test5.solidcommunity.net/public/bookmarks/" },
  { url: "https://spoggy-test5.solidcommunity.net/profile/card#me" },
  //
  { url: "https://spoggy-test7.solidcommunity.net/" },
  { url: "https://spoggy-test7.solidcommunity.net/public/" },
  { url: "https://spoggy-test7.solidcommunity.net/public/bookmarks/" },
  { url: "https://spoggy-test7.solidcommunity.net/profile/card#me" },
  //
  { url: "https://spoggy-test9.solidcommunity.net/" },
  { url: "https://spoggy-test9.solidcommunity.net/public/" },
  { url: "https://spoggy-test9.solidcommunity.net/public/bookmarks/" },
  { url: "https://spoggy-test9.solidcommunity.net/profile/card#me" },
];

let searching = {
  url: "https://spoggy-test3.solidcommunity.net/profile/card#me",
};

// import * as dotenv from "dotenv";
// dotenv.config();

export const run = async () => {
  for (let r of resources) {
    r.start = Date.now();
    r = await getContent(r);
    if (r.shingles != undefined && r.shingles.length > 0) {
      r.mini = addToMinhash(r);
      r.end = Date.now();
      r.duration = r.end - r.start;
      console.log("inserted : ", r.duration, r.url);
    } else {
      console.log("no shingles ", r.url);
    }
  }

  //console.log("resources", JSON.stringify(resources, null, 2));

  await search();
};

run();

async function search() {
  console.log("\n\nsearching", searching);
  let r = searching;
  r = await getContent(r);
  r.mini = addToMinhash(r);
  var matches = index.query(r.mini);
  console.log("Jaccard similarity >= 0.5 to search.url:", matches);

  //   let results = []
  resources.forEach((res) => {
    if (res.mini != undefined) {
      let jac = r.mini.jaccard(res.mini);
      console.log(res.url, jac);
    } else {
      console.log("\tnot in index " + res.url);
    }
  });
}

function addToMinhash(r) {
  var m = new Minhash();
  r.shingles.map(function (w) {
    m.update(w);
  });
  index.insert(r.url, m);
  // console.log("index length", index.index.length);
  fs.writeFile("./index/index", JSON.stringify(index, null, 2), (err) => {
    if (err) {
      console.error(err);
    }
    // fichier écrit avec succès
  });

  indexed.resources[r.url] == undefined ? (indexed.resources[r.url] = {}) : "";
  indexed.resources[r.url].date = Date.now(); // + cid + md5

  indexed.end = Date.now();
  fs.writeFile("./index/indexed", JSON.stringify(indexed, null, 2), (err) => {
    if (err) {
      console.error(err);
    }
    // fichier écrit avec succès
  });
  return m;
}

async function getContent(r) {
  console.log("__get content", r.url);
  let response = await fetch(r.url, {
    method: "GET",
    headers: {
      // Accept: "application/ld+json",
    },
  });
  //r.content = await response.json();
  r.status = response.status;
  r.statusText = response.statusText;
  if (response.status == 200) {
    r.text = await response.text();
    explore(r);
    r.shingles = r.text.split(new RegExp(shingleSeparators.join("|"), "g"));
    r.shingles = r.shingles.map((s) => s.trim());
    r.shingles = [...new Set(r.shingles)]; // remove duplicate

    r.shingles = r.shingles.filter((s) => s.length > shingleMinLength);
  } else {
    console.log(r.status, r.statusText, r.url);
  }

  //.split("/");
  return r;
}

function explore(r) {
  // console.log(r.text);

  try {
    const jsonld = converter.ttl_jsonld(r.text);
    console.log(JSON.stringify(jsonld, null, 2));
  } catch (e) {
    let date = Date.now();
    let mess = "\n\n!!!!!!!!!!!cannot convert\t" + r.url + "\n" + e + "\n";
    console.error(mess);
    let error = {
      date: date,
      url: r.url,
      action: "convert ttl2json",
      ttl: r.text,
      error: e.message,
    };
    fs.writeFile("./errors/" + date, JSON.stringify(error, null, 2), (err) => {
      if (err) {
        console.error(err);
      }
      // fichier écrit avec succès
    });
  }
}
