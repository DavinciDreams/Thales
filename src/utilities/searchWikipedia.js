import wiki from 'wikipedia';
import {
  __dirname
} from "./__dirname.js";
import weaviate from "weaviate-client";
import fs from 'fs';
import {
  makeGPTRequest
} from "./makeGPTRequest.js";
import axios from "axios";
import path from "path";
import glob from "glob";

const client = weaviate.client({
  scheme: "http",
  host: "semantic-search-wikipedia-with-weaviate.api.vectors.network:8080/",
});

export const searchWikipedia = async (keyword) => {

  // if keywords contains more than three words, summarize with GPT-3
  if (keyword.trim().split(" ").length > 3) {
    const data = {
      "prompt": keyword + "\n\nKeywords:",
      "temperature": 0.3,
      "max_tokens": 60,
      "top_p": 1,
      "frequency_penalty": 0.8,
      "presence_penalty": 0,
      "stop": ['\n']
    };

    const {
      success,
      choice
    } = await makeGPTRequest(data, null, null, "conversation");
    if (success) {
      keyword = choice.text;
    }
  }

  // Search for it, and accept suggestion if there is one
  const searchResults = await wiki.search(keyword);
  console.log(searchResults);
  // If the first result contains the keyword or vice versa, probably just go with it
  if (searchResults.results[0] && (searchResults.results[0] .title.toLowerCase().includes(keyword.toLowerCase()) ||
    keyword.toLowerCase().includes(searchResults.results[0] .title.toLowerCase()))) {
    keyword = searchResults.results[0].title;
  } else  if (searchResults.suggestion) {
    keyword = searchResults.suggestion;
  } else if (searchResults[0] != undefined) {
    keyword = searchResults[0].title;
  }

  // TODO: If certainty is below .92...
  // Fuzzy match and sort titles

  let filePath = null;

  glob(keyword + '.*', (err, files) => {
    if (err) {
      console.log(err);
    } else {
      // a list of paths to javaScript files in the current working directory
      console.log(files);
      filePath = files[0];
    }
  });

  // if (!filePath) {
  //   console.log("Trying to load file");
  //   try {
  //     const response = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=pageimages&piprop=original&titles=${keyword}`);
  //     if (response && response.data.query.pages.filter(page => page.original)[0]) {
  //       const page = response.data.query.pages.filter(page => page.original)[0];
  //       console.log("Getting file");
  //       const file = await axios.get(page.original.source, {
  //         responseType: 'stream'
  //       });
  //       // store the image from the response in /images as <keyword>.jpg using fs
  //       const newFilePath = path.resolve(__dirname, "images", keyword + "." + page.original.source.split('.').pop());
  //       console.log("New file path is", newFilePath);
  //       // const writer = fs.createWriteStream(path.resolve(__dirname, "images", newFilePath));
  //       console.log("Created writer");
  //       // file.data.pipe(writer)
  //       filePath = newFilePath;
  //       // {"batchcomplete":true,"query":{"pages":[{"pageid":210458,"ns":0,"title":"Waffle","original":{"source":"https://upload.wikimedia.org/wikipedia/commons/5/5b/Waffles_with_Strawberries.jpg","width":2592,"height":1944}}]}}
  //     }
  //   } catch (error) {
  //     console.log("Error is " + error);
  //   }
  // }
  // Get wikipedia article for first result and cache

  // clubhouse?


  // TODO: Check if we already have the image for the keyword before doing all that hard stuff
  // Return object containing hasImage: true and the file URI
  // Change the places that call this function to reflect payload
  // Handle sending image with response to this initialization
  // Make sure we're actually doing something with response in client to parse image and load it
  // Only load or send image for platforms where it matters
  
  if(searchResults.results[0] .title.trim().toLowerCase() === keyword.trim().toLowerCase() ){
    const result = await lookUpOnWikipedia(keyword);
    return {
      result,
      filePath
    }
  }

  console.log("Making weaviate request");
   // if it's not immediately located, request from weaviate
  const weaviateResponse = await makeWeaviateRequest(keyword);

  console.log("res is", weaviateResponse)
  console.log("Looking up result on wikipedia", weaviateResponse.Paragraph[0].inArticle[0].title);
  const result = await lookUpOnWikipedia(weaviateResponse.Paragraph[0].inArticle[0].title);
  return {
    result,
    filePath
  }
}

export const makeWeaviateRequest = async (keyword) => {
  const res = await client.graphql
    .get()
    .withNearText({
      concepts: [keyword],
      certainty: 0.75,
    })
    .withClassName("Paragraph")
    .withFields("title content inArticle { ... on Article {  title } }")
    .withLimit(3)
    .do();
  // console.log("res is", res.data.Get.Paragraph[0]);

  if (res.data.Get !== undefined) {
    return res.data.Get;
  }
  return;
};


export async function lookUpOnWikipedia(subject) {
  try {
    // check if file exists already, in the folder 'src/data/wikipedia/' with the filename 'subject.json'
    const fileName = `${__dirname}/data/wikipedia/${subject}.json`;
    // if it does, read it and return it
    if (fs.existsSync(fileName)) {
      return JSON.parse(fs.readFileSync(fileName, 'utf8'));
    } else {
      console.log("Data doesn't yet exist");
    }

    // if it doesn't, fetch it from wikipedia and save it to the file
    const {
      title,
      displaytitle,
      description,
      extract
    } = await wiki.summary(subject);
    console.log("Got summary", title)
    const summary = {
      title,
      displaytitle,
      description,
      extract
    };
    console.log("Summary is", summary)
    // create a directory recursively at data/wikipedia/ if it doesn't exist
    const dir = __dirname + "/data/wikipedia/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
    console.log("Writing JSON");
    fs.writeFileSync(fileName, JSON.stringify(summary));

    return summary;

  } catch (error) {
    console.log(error);
  }
  console.log("Finished looking up on wikipedia")
}