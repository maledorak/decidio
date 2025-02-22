import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import Handlebars from "handlebars";

export type SystemMessage = {
  role: 'system'
  content: string
}

export type CompletionMessage = {
  role: 'user' | 'assistant'
  content: string
}

// export type PromptMessages = SystemMessage | CompletionMessage

export function loadAnthropicMessages(name: string, vars: Record<string, string> = {}) {
  const filePath = path.join(process.cwd(), 'src', 'prompts', `${name}.yaml`)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const rawMessages = yaml.parse(fileContents)
  rawMessages.forEach((message) => {
    message.content = Handlebars.compile(message.content)(vars)
  })

  const messages = {
    system: '',
    rest: []
  }
  for (const message of rawMessages) {
    if (message.role === 'system') {
      messages['system'] = message.content
    } else {
      messages['rest'] = [...messages['rest'], message]
    }
  }
  return messages
}
