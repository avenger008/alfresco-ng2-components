/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { baseHost, WidgetComponent, IdentityUserModel } from '@alfresco/adf-core';

/* tslint:disable:component-selector  */

@Component({
    selector: 'people-cloud-widget',
    templateUrl: './people-cloud.widget.html',
    host: baseHost,
    encapsulation: ViewEncapsulation.None
})
export class PeopleCloudWidgetComponent extends WidgetComponent implements OnInit {

    appName: string;
    roles: string[];
    mode: string;
    title: string;
    preSelectUsers: IdentityUserModel[];

    ngOnInit() {
        if (this.field) {
            this.roles = this.field.roles;
            this.mode = this.field.optionType;
            this.title = this.field.placeholder;
            this.preSelectUsers = this.field.value ? this.field.value : [];
        }
    }

    onSelectUser(user: IdentityUserModel) {
        this.field.value = [...this.field.value, user];
        this.onFieldChanged(this.field);
    }

    onRemoveUser(user: IdentityUserModel) {
        const indexToRemove = this.field.value.findIndex((selectedUser) => { return selectedUser.id === user.id; });
        this.field.value.splice(indexToRemove, 1);
        this.field.value = [...this.field.value];
        this.onFieldChanged(this.field);
    }
}
