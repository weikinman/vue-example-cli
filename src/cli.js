import arg from 'arg';
import inquirer from 'inquirer';
import { createProject, updateProject } from './main.js';

function parseArgumentsIntoOptions(rawArgs) {
    // console.log(rawArgs);
    const args = arg({
        '--git': Boolean,
        '--yes': Boolean,
        '--install': Boolean,
        '--updatef': Boolean,
        '-g': '--git',
        '-y': '--yes',
        '-i': '--install',
        '-u': '--updatef'
    }, {
        argv: rawArgs.slice(2),
    });
    //  console.log(args);
    return {
        skipPrompts: args['--yes'] || false,
        git: args['--git'] || false,
        template: args._[0],
        runInstall: args['--install'] || false,
        isUpdate: args['--updatef'] || false
    };
}

async function promptForMissingOptions(options) {
    const defaultTemplate = 'JavaScript';
    if (options.skipPrompts) {
        return {
            ...options,
            template: options.template || defaultTemplate,
        };
    }

    const questions = [];

    if (options.isUpdate) {
        questions.push({
            type: 'confirm',
            name: 'update',
            message: 'components and modules update?',
            default: false,
        });
    } else {
        if (!options.template) {
            questions.push({
                type: 'list',
                name: 'template',
                message: 'Please choose which project template to use',
                choices: ['JavaScript', 'TypeScript'],
                default: defaultTemplate,
            });
        }

        if (!options.git) {
            questions.push({
                type: 'confirm',
                name: 'git',
                message: 'Initialize a git repository?',
                default: false,
            });
        }
    }



    const answers = await inquirer.prompt(questions);
    // console.log(answers);
    return {
        ...options,
        template: options.template || answers.template,
        git: options.git || answers.git,
        ...answers
    };
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    // console.log(options);
    if (options.isUpdate == true) {


        options = await promptForMissingOptions(options);
        if (options.update) {
            await updateProject(options);
        }

    } else {
        options = await promptForMissingOptions(options);
        await createProject(options);
    }

}