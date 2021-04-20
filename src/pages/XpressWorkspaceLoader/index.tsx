/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import React from 'react';
import { History } from 'history';
import { connect, ConnectedProps } from 'react-redux';
import { load } from 'js-yaml';
import * as WorkspaceStore from '../../store/Workspaces';
import { AppState } from '../../store';
import { fetchDevfile } from '../../services/registry/devfiles';
import { selectAllWorkspaces } from '../../store/Workspaces/selectors';
import { XpressDevfileLocation } from '../../services/xpress/xpress-devfile-location';

type Props = MappedProps & {
  history: History;
}

type State = {
}

/**
 * Initiates Xpress default workspace creation and loading
 */
export class XpressWorkspaceLoader extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    // Create/show default workspace
    this.createAndshowDefaultWorkspace();
  }

  public render(): React.ReactElement {
    return (
      <div>
        <td>Loading sandbox. Please wait...</td>
      </div>
    );
  }

  /**
   * This method creates a workspace if it does not exist already.
   * Otherwise, the existing workspace is shown to the user.
   */
  async createAndshowDefaultWorkspace() {
    let workspace;
    const workspacesCount = this.props.allWorkspaces.length;

    // check if there are any workspace existing already
    if (workspacesCount === 0) {
      // create a new workspace for the user
      console.log('Creating new workspace');
      workspace = await this.createWorkspace();
    } else {
      // Use the existing workspace and show it to the user
      console.log('Opening existing workspace');
      workspace = this.props.allWorkspaces[0];
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const workspaceName = workspace.devfile.metadata.name!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const namespace = workspace.namespace!;
    console.log(`Opening workspace: workspaceName = ${workspaceName} namespace = ${namespace}`);

    // force start for the new workspace
    try {
      this.props.history.push(`/ide/${workspace.namespace}/${workspaceName}`);
    } catch (error) {
      console.log('Error while starting workspace');
      throw new Error(error);
    }
  }

  /**
   * Create a new workspace from the devfile and return it
   * @returns workspace
   */
  async createWorkspace(): Promise<any> {
    let workspace;

    const devfileUrl = XpressDevfileLocation.location() + XpressDevfileLocation.link;
    console.log(`devfileUrl = ${devfileUrl}`);

    // Load the devfile
    const devfileContent = await fetchDevfile(devfileUrl);
    if (devfileContent) {

      const devfile = load(devfileContent);
      if (devfileContent) {

        // Create workspace
        try {
          workspace = await this.props.createWorkspaceFromDevfile(devfile, undefined, undefined, {});
        } catch (e) {
          console.log('Error when creating a workspace');
          throw new Error(e.message);
        }
      }
    }

    return workspace;
  }
}

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
});

const connector = connect(
  mapStateToProps,
  {
    ...WorkspaceStore.actionCreators,
  },
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(XpressWorkspaceLoader);
