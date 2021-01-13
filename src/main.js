import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import os from 'os';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
    return copy(options.templateDirectory, options.targetDirectory, {
        clobber: false,
    });
}
const cloneUrl = 'http://gitlab.boardware.com/scott/vue-framework-example.git'
async function gitCloneProject(options) {
    const result = await execa('git', ['clone', cloneUrl], {
        cwd: options.targetDirectory,
    });
    if (result.failed) {
        return Promise.reject(new Error('Failed to initialize git'));
    }
    return;
}
const libscomponentsUrl = '\\src\\libs\\components';
const libsmodulesUrl = '\\src\\libs\\modules';
async function updateLib(options) {
    // console.log(options.libComponentsDirectory);
    //  console.log(options.targetDirectory + libscomponentsUrl);
    return copy(options.libComponentsDirectory, options.targetDirectory + libscomponentsUrl, {
        clobber: true,
    });
}
async function updateLibModule(options) {
    //  console.log(options.libModulesDirectory);
    //  console.log(options.targetDirectory + libsmodulesUrl);
    return copy(options.libModulesDirectory, options.targetDirectory + libsmodulesUrl, {
        clobber: true,
    });
}
async function initGit(options) {
    const result = await execa('git', ['init'], {
        cwd: options.targetDirectory,
    });
    if (result.failed) {
        return Promise.reject(new Error('Failed to initialize git'));
    }
    return;
}

export async function updateProject(options) {
    options = {
        ...options,
        targetDirectory: options.targetDirectory || process.cwd(),
    };

    const currentFileUrl =
        import.meta.url;
    console.log(currentFileUrl);
    let url = new URL(currentFileUrl).pathname;
    const arch = os.arch();
    if (arch == 'x32' || arch == 'x64') {
        url = url.substr(1, url.length);
    }

    console.log(arch + 'arch---', url);
    const libComponentsDir = path.resolve(
        url,
        '../../libs/components'
    );
    const libModulesDir = path.resolve(
        url,
        '../../libs/modules'
    );
    options.libComponentsDirectory = libComponentsDir;
    //  console.log('-----------------libComponentsDirectory');
    //  console.log(options);
    options.libModulesDirectory = libModulesDir;
    const tasks = new Listr([{
            title: 'update components',
            task: () => updateLib(options),
            enabled: () => options.isUpdate,
        },
        {
            title: 'update modules',
            task: () => updateLibModule(options),
            enabled: () => options.isUpdate,
        },

    ]);

    await tasks.run();

    console.log('%s Project ready', chalk.green.bold('DONE'));
    return true;
}
export async function createProject(options) {
    options = {
        ...options,
        targetDirectory: options.targetDirectory || process.cwd(),
    };

    const currentFileUrl =
        import.meta.url;
    console.log(currentFileUrl);
    let url = new URL(currentFileUrl).pathname;
    const arch = os.arch();
    if (arch == 'x32' || arch == 'x64') {
        url = url.substr(1, url.length);
    }

    //  console.log(arch + 'arch---', url);
    const libComponentsDir = path.resolve(
        url,
        '../../libs/components'
    );
    const libModulesDir = path.resolve(
        url,
        '../../libs/modules'
    );
    const templateDir = path.resolve(
        url,
        '../../templates',
        options.template.toLowerCase()
    );
    options.libComponentsDirectory = libComponentsDir;
    //   console.log('-----------------libComponentsDirectory');
    //   console.log(options);
    options.libModulesDirectory = libModulesDir;
    options.templateDirectory = templateDir;
    //   console.log(templateDir)
    try {
        await access(templateDir, fs.constants.R_OK);
    } catch (err) {
        console.error('%s Invalid template name', chalk.red.bold('ERROR'));
        process.exit(1);
    }

    const tasks = new Listr([
        // {
        //     title: 'Copy project files',
        //     task: () => copyTemplateFiles(options),
        // },
        {
            title: 'clone Project By git',
            task: () => gitCloneProject(options),
            enabled: () => options.git,
        },
        // {
        //     title: 'Initialize git',
        //     task: () => initGit(options),
        //     enabled: () => options.git,
        // },
        {
            title: 'Install dependencies',
            task: () =>
                projectInstall({
                    cwd: options.targetDirectory,
                }),
            skip: () =>
                !options.runInstall ?
                'Pass --install to automatically install dependencies' : undefined,
        },
    ]);

    await tasks.run();

    console.log('%s Project ready', chalk.green.bold('DONE'));
    return true;
}