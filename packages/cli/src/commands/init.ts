import { Command, flags } from '@oclif/command'
import * as path from 'path'
import { promptUser, getListOptions } from '../utils/commands'
var execa = require('execa')
var Listr = require('listr')
var yeoman = require('yeoman-environment')
var env = yeoman.createEnv()
env.register(require.resolve('@wcfactory/generator-wcfactory/generators/init'), 'wcfactory:init')

export default class Init extends Command {
  static description = 'Create mono repo for your element library. You will only need to do this once.'

  /**
   * @todo dynaimically generate this based on the questions const
   */
  static flags = {
    // global
    help: flags.help({ char: 'h' }),
    verbose: flags.boolean({ char: 'v', description: 'Verbose mode' }),
    // specific to this command
    humanName: flags.string({ char: 'h', description: 'Name of this factory' }),
    description: flags.string({ char: 'd', description: 'Description of this factory' }),
    orgNpm: flags.string({ char: 'o', description: 'NPM organization name (include @)' }),
    orgGit: flags.string({ char: 'O', description: 'Git organization name' }),
    name: flags.string({ char: 'n', description: 'Git organization name' }),
    gitRepo: flags.string({ char: 'g', description: 'Your Repo name. Must be a valid git/npm name' }),
  }

  async run() {
    // process the user input
    let { args, flags } = this.parse(Init)
    // prompt the user for more info
    flags = await promptUser(questions, flags, this)
    // add a year
    flags.year = new Date().getFullYear()
    // now we are going to assemble a task list
    const listOptions = getListOptions(flags)
    // assemble a list
    const list = new Listr([
      {
        title: 'Setting up files',
        task: async () => {
          const res = await env.run('wcfactory:init', flags)
        }
      },
      {
        title: 'Initializing Git',
        task: async () => execa('git', ['init']).stdout
      },
      {
        title: 'Installing dependencies',
        task: async () => execa('yarn', ['install']).stdout
      },
      {
        title: 'Running Initalizer',
        task: async () => execa('yarn', ['run', 'init']).stdout
      },
      {
        title: 'Rebuilding cache',
        task: async () => execa('yarn', ['run', 'rebuild-wcfacache']).stdout
      }
    ], listOptions)
    // run the list
    list.run();
  }
}


/**
 * A listing of all prompt questions
 */
const questions: any = [
  {
    type: "string",
    name: "humanName",
    message: "Name of this factory",
    required: true,
    store: true,
    default: (flags: any) => {
      return path.basename(process.cwd())
    }
  },
  {
    type: "string",
    name: "description",
    message: "Description",
    required: true,
    store: true
  },
  {
    type: "string",
    name: "name",
    message: "Repo name (a valid git / npm machine name)",
    required: true,
    default: (flags: any) => flags.humanName.trim().replace(' ', '-'),
    postProcess: (value: any) => value.trim().replace(' ', '-')
  },
  {
    type: "string",
    name: "orgNpm",
    message: "NPM organization name (include @)",
    required: true,
    store: true,
    default: (flags: any) => '@' + flags.name,
    postProcess: (value: any) => value.trim().replace(' ', '-')
  },
  {
    type: "string",
    name: "orgGit",
    message: "Git organization name",
    required: true,
    store: true,
    default: (flags: any) => flags.name.replace('@', ''),
    postProcess: (value: any) => value.trim().replace(' ', '-')
  },
  {
    type: "string",
    name: "gitRepo",
    message: "Git repo (full git address)",
    required: true,
    default: (flags: any) => `git@github.com:${flags.orgGit}/${flags.name}.git`
  }
]
