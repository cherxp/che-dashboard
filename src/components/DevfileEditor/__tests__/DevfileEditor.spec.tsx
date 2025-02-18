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
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { Provider } from 'react-redux';
import DevfileEditor from '../';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { createFakeCheWorkspace } from '../../../store/__mocks__/workspace';
import { languages, editor } from 'monaco-editor-core/esm/vs/editor/editor.main';

jest.mock('../../../../node_modules/monaco-editor-core/esm/vs/editor/editor.main', () => {
  return () => ({ languages, editor });
});

describe('The DevfileEditor component', () => {

  it('should initialize the component correctly', () => {
    const workspaceName = 'wksp-test';
    const workspaceId = 'testWorkspaceId';
    const location = 'location[ \t]*(.*)[ \t]*$';
    const onChange = jest.fn();

    const component = renderComponent(workspaceName, workspaceId, location, onChange);

    expect(onChange).not.toBeCalled();
    expect(component.toJSON()).toMatchSnapshot();
  });
});

function renderComponent(
  workspaceName: string,
  workspaceId: string,
  decorationPattern: string,
  onChange: (devfile: che.WorkspaceDevfile, isValid: boolean) => void
): ReactTestRenderer {
  const workspace = createFakeCheWorkspace(workspaceId, workspaceName);
  const store = new FakeStoreBuilder().withCheWorkspaces({
    workspaces: [workspace],
  }).withBranding({
    docs: {
      devfile: 'devfile/documentation/link',
    },
  } as BrandingData).build();
  return renderer.create(
    <Provider store={store}>
      <DevfileEditor
        devfile={workspace.devfile as che.WorkspaceDevfile}
        decorationPattern={decorationPattern}
        onChange={onChange}
      />
    </Provider>,
  );
}
