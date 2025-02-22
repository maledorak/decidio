import fs from 'fs'
import path from 'path'
import yaml from 'yaml'


export function loadPrompt(promptName: string) {
  const filePath = path.join(process.cwd(), 'src', 'prompts', `${promptName}.yaml`)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const data = yaml.parse(fileContents)
  return data
}
