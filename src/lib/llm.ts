import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import Handlebars from "handlebars";
import { type MessageParam } from '@anthropic-ai/sdk/resources/messages/messages';

export type SystemMessage = {
  role: 'system'
  content: string
}

type YamlMessages = MessageParam[] | SystemMessage[]

export function loadAnthropicMessages(name: string, vars: Record<string, string> = {}) {
  const filePath = path.join(process.cwd(), 'src', 'prompts', `${name}.yaml`)
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const yamlMessages: YamlMessages = yaml.parse(fileContents)
  yamlMessages.forEach((message: SystemMessage | MessageParam) => {
    message.content = Handlebars.compile(message.content)(vars)
  })

  const messages = {
    system: '',
    rest: [] as MessageParam[]
  }
  for (const message of yamlMessages) {
    if (message.role === 'system') {
      messages['system'] = message.content
    } else {
      messages['rest'] = [...messages['rest'], message]
    }
  }
  return messages
}
