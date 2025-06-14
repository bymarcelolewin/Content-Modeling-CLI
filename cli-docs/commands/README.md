# CLI Commands
[<- Back to Documentation](../README.md)

| Command               | Description                                                                                          | Flags                                                                                                                                                 |
|:---------------------|:-----------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------|
| `cm init`            | Initializes a new CLI project with a standard folder structure and config file.                      | `--name`: Display name of the new project. Will be normalized into a safe folder name.<br>`--git`: Initializes Git at the project root and adds a `.gitignore` to exclude `.contentfulrc.json`. If Git is not installed, you'll be prompted to continue without version control. |
| `cm create-model`    | Creates a new content model using a specified template. Includes components and emojis library. | `--model`: Name of the new model folder to create.<br>`--template`: Name of the template to use.                                                     |
| `cm push-model`      | Pushes all content types from the specified model folder to Contentful. Without `--force`, it performs a dry run and does not create anything. | `--model`: Name of the existing model folder.<br>`--force`: Actually pushes the model to Contentful. Without it, the command runs in dry run mode and shows what would be created. | `cm add-content-type`| Adds a new content type to an existing model.                                                        | `--model`: Name of the existing model folder.<br>`--name`: Display name of the new content type (e.g., "Article - Blog").                           |
| `cm delete-model`    | Deletes an entire content model in Contentful, including its content types and entries. If --force is not included, it will only be a dry run. This will not delete the model folder locally. | `--model`: Name of the model folder to delete.<br>`--force`: Actually deletes the content; otherwise, it performs a dry run.                         |
| `cm list-templates`  | Lists all available content model templates and their content types.                                 | —                                                                                                                                                    |
| `cm list-models`     | Lists all the content models you created so far.                                                     | —                                                                                                                                                    |

---
<br>

[<- Back to Documentation](../README.md)