/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { V1alpha2DevWorkspaceSpecTemplate } from '@devfile/api';
import { V1alpha2DevWorkspaceSpecTemplateCommands } from '@devfile/api/models/V1alpha2DevWorkspaceSpecTemplateCommands';
import { V1alpha2DevWorkspaceSpecTemplateCommandsItemsExec } from '@devfile/api/models/V1alpha2DevWorkspaceSpecTemplateCommandsItemsExec';

const SSH_AGENT_START_EVENT_ID = 'init-ssh-agent-command';

const SSH_AGENT_COMMAND_LINE = `
SSH_ENV_PATH=$HOME/ssh-environment && \
if [ -f /etc/ssh/passphrase ] && [ -w $HOME ] && command -v ssh-add >/dev/null && command -v ssh-agent >/dev/null; then
    ssh-agent | sed 's/^echo/#echo/' > $SSH_ENV_PATH \
    && chmod 600 $SSH_ENV_PATH \
    && source $SSH_ENV_PATH \
    && if timeout 3 ssh-add /etc/ssh/dwo_ssh_key < /etc/ssh/passphrase && [ -f $HOME/.bashrc ] && [ -w $HOME/.bashrc ]; then
        echo "source \${SSH_ENV_PATH}" >> $HOME/.bashrc
    fi
fi
`;

async function getInitContainers(template: V1alpha2DevWorkspaceSpecTemplate) {
  
}

export async function addSshAgentPostStartEvent(
  template: V1alpha2DevWorkspaceSpecTemplate | undefined,
) {
  if (!template) {
    return;
  }
  if (!template.commands) {
    template.commands = [];
  }

  if (!template.events) {
    template.events = { postStart: [] };
  }

  const { mainComponents } = await getInitContainers(template); // Adjust to your lifecycle module

  mainComponents.forEach((component: { container: any; name: any }, index: any) => {
    if (!component.container) return;

    const commandId = `${SSH_AGENT_START_EVENT_ID}-${index}`;

    const execCommand: V1alpha2DevWorkspaceSpecTemplateCommandsItemsExec = {
      commandLine: SSH_AGENT_COMMAND_LINE,
      component: component.name,
    };

    const command: V1alpha2DevWorkspaceSpecTemplateCommands = {
      id: commandId,
      exec: execCommand,
    };

    template.commands!.push(command);
    template.events!.postStart!.push(commandId);
  });
}
