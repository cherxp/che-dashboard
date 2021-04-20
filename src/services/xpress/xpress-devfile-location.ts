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

/**
 * Provides the location of the devfile.
 * "location + link" should give the complete link.
 */
export class XpressDevfileLocation {

  /**
   * Repo having the devfile
   */

  public static location(): string {
    const server = 'MCU8';

    if (server.localeCompare('Develop') === 0) {
      return 'https://raw.githubusercontent.com/mplab-xpresside/devfiles-dev/main';
    }
    else if (server.localeCompare('Staging') === 0) {
      return 'https://raw.githubusercontent.com/mplab-xpresside/devfiles-stage/main';
    }
    else if (server.localeCompare('Production') === 0) {
      return 'https://raw.githubusercontent.com/mplab-xpresside/devfiles/master';
    }
    else if (server.localeCompare('MCU8') === 0) {
      return 'https://raw.githubusercontent.com/mplab-xpresside/devfiles-mcu8/main';
    }

    return 'https://raw.githubusercontent.com/mplab-xpresside/devfiles-dev/main';
  }

  /**
  * Devfile link
  */

  public static link = '/xpress-devfile.yaml';

}
