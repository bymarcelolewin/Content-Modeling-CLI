//======================================
// file: push-content-model.js
// version: 2.4
// last updated: 05-23-2025
//======================================

require("module-alias/register");

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const resolveEmoji = require("@resolve-emoji");
const { expandComponents } = require("@expand");
const loadProjectRoot = require("@loadProjectRoot");

const fieldRegistry = require("@fields/field-registry.json");

const cliFieldsDir = path.join(__dirname, "..", "cli-fields");
const cliTempDir = path.join(__dirname, "..", "cli-temp");
const relativeFieldsDir = "../cli-fields";
const relativeRegistryPath = "../cli-fields/field-registry.json";
const relativeResolveEmoji = "../cli-utilities/resolve-emoji.js";

const args = process.argv.slice(2);
const modelFlagIndex = args.indexOf("--model");
const modelName = modelFlagIndex !== -1 ? args[modelFlagIndex + 1] : null;

if (!modelName) {
  console.error("❌ Please provide a content model using --model");
  console.error("Usage: cm push-model --model [model-name]");
  process.exit(1);
}

const projectRoot = loadProjectRoot();
const modelFolder = path.join(projectRoot, "content-models", "models", modelName);
const contentTypesFolder = path.join(modelFolder, "content-types");
const componentsFolder = path.join(projectRoot, "content-models", "components");
const emojisPath = path.join(projectRoot, "content-models", "emojis.json");
const tempScriptFilename = `temp-push-content-model-${modelName}.js`;
const tempModelScriptPath = path.join(cliTempDir, tempScriptFilename);

// --------------------------------------------
// 🧼 Generate temp-push-content-model.js
// --------------------------------------------
try {
  if (!fs.existsSync(contentTypesFolder)) {
    console.error(`❌ content-types folder does not exist at: ${contentTypesFolder}`);
    process.exit(1);
  }

  if (fs.existsSync(tempModelScriptPath)) {
    fs.unlinkSync(tempModelScriptPath);
    console.log(`🗑️  Deleted existing ${tempScriptFilename}`);
  }

  const files = fs.readdirSync(contentTypesFolder).filter((file) => file.endsWith(".json"));

  if (files.length === 0) {
    console.error(`❌ No .json files found in ${contentTypesFolder}`);
    process.exit(1);
  }

  const contentTypeObjects = files.map((file) => {
    const fullPath = path.join(contentTypesFolder, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const def = JSON.parse(raw);

    def.__filename = file;
    def.emoji = resolveEmoji(def.emoji, emojisPath);

    const expanded = expandComponents(def, componentsFolder);

    // Check for unsupported field types like local
    for (const field of expanded.fields) {
      if (typeof field.type !== "string") continue;
      const [namespace, typeName] = field.type.split(".");
      if (!namespace || !typeName) {
        throw new Error(`❌ Field type must include a namespace (e.g., 'global.text') in ${def.__filename}`);
      }
      if (namespace === "local") {
        const origin = field.__sourceComponent
          ? `${field.__sourceComponentNamespace || "local"}.${field.__sourceComponent}`
          : def.__filename;

        throw new Error(`❌ Local field types are not yet supported: ${field.type} in ${origin}`);
      }
    }

    expanded.fields = expanded.fields.map((f) => ({
      ...f,
      emojiPath: emojisPath,
    }));

    return expanded;
  });

  const tempScript = `const path = require("path");
const fs = require("fs");
const resolveEmoji = require("${relativeResolveEmoji}");
const fieldRegistry = require("${relativeRegistryPath}");

const typeToHandler = {};
fieldRegistry.forEach(({ type, function: functionName, file }) => {
  const module = require("${relativeFieldsDir}/" + file);
  if (!module[functionName]) {
    throw new Error(\`❌ Function "\${functionName}" not found in \${file}\`);
  }
  typeToHandler[type] = module[functionName];
});

module.exports = function (migration) {
${contentTypeObjects.map((def) => {
  const varName = `ct_${def.id}`;
  return `
  // 👉 ${def.__filename}
  const ${varName} = migration.createContentType("${def.id}", {
    name: ${JSON.stringify(def.emoji ? def.emoji + " " + def.name : def.name)},
    description: ${JSON.stringify(def.description || "")},
    displayField: ${JSON.stringify(def.entryField || "title")}
  });

  ${JSON.stringify(def.fields, null, 2)}.forEach((field) => {
    const [namespace, typeName] = field.type.split(".");
    if (!namespace || !typeName) {
      throw new Error("❌ Field type must include a namespace (e.g., 'global.text') in ${def.__filename}");
    }

    if (namespace === "global") {
      const handler = typeToHandler[typeName];
      if (!handler) {
        throw new Error("❌ Unsupported global field type: " + typeName + " in ${def.__filename}");
      }
      field.type = typeName;
      handler(${varName}, field);
    } else if (namespace === "local") {
      throw new Error("❌ Local field types are not yet supported: " + field.type + " in ${def.__filename}");
    } else {
      throw new Error("❌ Unknown field namespace: " + namespace + " in ${def.__filename}");
    }
  });`;
}).join("\n")}
};
`;

  fs.writeFileSync(tempModelScriptPath, tempScript);
  console.log("\n---------------------------------------");
  console.log("INITIALIZING");
  console.log("---------------------------------------");
  console.log(`\n>> Generated ${tempScriptFilename} in cli-temp`);
} catch (err) {
  if (err.message.startsWith("❌")) {
    console.error(err.message);
  } else {
    console.error(`❌ Failed to generate ${tempScriptFilename}: ${err.message}`);
  }
  process.exit(1);
}

// --------------------------------------------
// 🚀 Run the migration script
// --------------------------------------------
console.log(`>> Running migration script for installing "${modelName}"...`);
console.log("\n---------------------------------------");
console.log("MIGRATING - CONFIRMATION REQUIRED");
console.log("---------------------------------------");

try {
  const contentfulBinPath = path.join(__dirname, "../node_modules/.bin/contentful");

  if (!fs.existsSync(contentfulBinPath)) {
    console.error("❌ Contentful CLI not found. Run `npm install` in the CLI root.");
    process.exit(1);
  }

  execSync(
    `"${contentfulBinPath}" space migration "${tempModelScriptPath}"`,
    {
      stdio: "inherit",
      cwd: modelFolder,
    }
  );

  console.log(`✅ Migration complete for "${modelName}"`);
  fs.unlinkSync(tempModelScriptPath);
  //console.log(`🧹 Deleted ${tempScriptFilename} after successful run`);
} catch (err) {
  console.error(`❌ Migration failed: ${err.message}`);
  console.warn(`⚠️ ${tempScriptFilename} left in cli-temp for inspection`);
}