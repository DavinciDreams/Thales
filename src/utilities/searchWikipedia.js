import wiki from 'wikipedia';
import { __dirname } from "./__dirname.js";
import weaviate from "weaviate-client";
import fs from 'fs';

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

    const { success, choice } = await makeGPTRequest(data, speaker, agent, "conversation");
    if (success) {
      keyword = choice.text;
    }
  }

  // Search for it, and accept suggestion if there is one
  const searchResults = await wiki.search(keyword);

  // If the first result contains the keyword or vice versa, probably just go with it
  if (searchResults.results[0]?.title.toLowerCase().includes(keyword.toLowerCase()) ||
    keyword.toLowerCase().includes(searchResults.results[0]?.title.toLowerCase())) {
    keyword = searchResults.results[0].title;
  } else

    if (searchResults.suggestion) {
      keyword = searchResults.suggestion;
    } else if (searchResults[0] != undefined) {
      keyword = searchResults[0].title;
    }

  // search it on wikipedia
  const summary = await lookUpOnWikipedia(keyword.trim());
  if (!summary.title.includes("Not found")) return summary;

  // if it's not immediately located, request from weaviate
  const res = await makeWeaviateRequest(keyword);

  // TODO: If certainty is below .92...
  // Fuzzy match and sort titles

  // Get wikipedia article for first result and cache
  return await lookUpOnWikipedia(res.Paragraph[0].inArticle[0].title);
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
};


export async function lookUpOnWikipedia(subject) {
  try {
    // check if file exists already, in the folder 'src/data/wikipedia/' with the filename 'subject.json'
    const fileName = `${__dirname}/data/wikipedia/${subject}.json`;
    // if it does, read it and return it
    if (fs.existsSync(fileName)) {
      return JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }

    // if it doesn't, fetch it from wikipedia and save it to the file
    const { title, displaytitle, description, extract } = await wiki.summary(subject);
    const summary = {
      title,
      displaytitle,
      description,
      extract
    };
    // create a directory recursively at data/wikipedia/ if it doesn't exist
    const dir = __dirname + "/data/wikipedia/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fileName, JSON.stringify(summary));

    return summary;

  } catch (error) {
    console.log(error);
  }
}