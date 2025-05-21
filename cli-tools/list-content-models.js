require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { createClient } = require("contentful-management");

// Root path to content models
const MODELS_DIR = path.join(__dirname, "../project/content-models");

function getContentModelFolders() {
  return fs.readdirSync(MODELS_DIR).filter((item) => {
    const fullPath = path.join(MODELS_DIR, item);
    return fs.statSync(fullPath).isDirectory();
  });
}

function main() {
  const folders = getContentModelFolders();
  console.log("CONTENT MODELS");
  folders.forEach((folder) => console.log(folder));
}

main();
