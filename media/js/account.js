import { AuthAPI } from "./modules/auth_api.js";

const hostings = getHostings();
const cpus = getCPUs();
const permissions = getPermissions();
const states = getStates();

const filter_select = document.getElementById('filter');

const max_retries = 3;
let personal_retries = 0;
let request_retries = 0;
let filter_retries = 0;


buildPersonal();
buildRequests();


function buildPersonal() {
    const personal = document.getElementById('personal')
    const personal_buttons = personal.querySelector('.buttons');

    AuthAPI.getCredentials()
        .then(json => {
            const name = personal.querySelector('h1');
            const email = personal.querySelector('h2');
            const permission = personal.querySelector('p');

            const permissionName = permissions[json.output.permissionID];

            name.innerHTML = `${json.output.firstName} ${json.output.lastName}`;

            email.innerHTML = `${json.output.email}`;
            permission.innerHTML += `${permissionName.permission}`;

            if (json.output.permissionID == 3) {
                personal_buttons.innerHTML += `<button class="button" onclick="window.location = 'requests/admin'">Админ-панель</button>`;
            }

            personal_buttons.innerHTML += `<button class="button" onclick="window.location = 'api/auth/log-out'">Выход</button>`;
        })
        .catch(err => {
            console.error("Error getting personal info: " + err);
            if (personal_retries < max_retries) {
                personal_retries += 1;
                buildPersonal();
            }
        });
}

function buildRequests(filter) {
    const requests = document.getElementById('requests');
    requests.innerHTML = '';

    if (!filter) {
        filter_select.innerHTML = '';
    }

    fetch("/api/requests/get")
        .then(response => {
            if (!response.ok) throw new Error("No response from server");
            return response.json();
        })
        .then(json => {
            if (json.output.length == 0) {
                requests.innerHTML = `
                    <h2>Пока у Вас нет заявок...</h2>
                    <p>Создайте новую заявку, нажав кнопку <b>"Новая заявка"</b> выше</p>
                `;
            } else {
                json.output.forEach(item => {
                    if (filter == item.stateID || filter == 0 || !filter) {
                        const state = states[item.stateID].state;

                        requests.innerHTML += `
                            <div class="request">
                                <div class="text">
                                    <h2>Заявка ${item.reservationID}</h2>
                                    <p>Статус: ${state}</p>
                                    <p>Стоимость: ${item.price} ₽</p>
                                    ${item.stateID == 2 ? "<p>Дата окончания: " + item.expirationDate + "</p>" : ""}
                                    ${item.note != '' ? "<br><p>Примечание:<br>" + item.note + "</p>" : ""}
                                </div>
                                <div class="buttons">
                                    <button class="button" onclick="requestCloseModal(${item.reservationID})">Отменить</button>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        })
        .then(() => {
            if (!filter) {
                fillFilter();
            }
        })
        .then(() => {
            if (!filter) {
                filter_select.addEventListener('change', function() {
                    filterRequests(this.value);
                });
            }
        })
        .catch(err => {
            console.log("Error getting requests: " + err);
            if (request_retries < max_retries) {
                request_retries += 1;
                buildRequests();
            }
        });
}

function getHostings() {
    const output = {};

    fetch("/api/hostings")
        .then(response => {
            if (!response.ok) throw new Error("No response from server");
            return response.json();
        })
        .then(json => {
            json.output.forEach(item => {
                output[item.hostingID] = {
                    'hostingAlias': item.hostingAlias,
                    'maxUsers': item.maxUsers,
                    'cpuID': item.cpuID,
                    'ram': item.ram,
                    'ramUser': item.ramUser,
                    'diskSpace': item.diskSpace,
                    'diskSpaceUser': item.diskSpaceUser,
                };
            })
        })
        .catch(err => {
            console.log("Error getting hostings list: " + err)
        });

    return output;
}

function getStates() {
    const output = {};

    fetch("/api/requests/get-states")
        .then(response => {
            if (!response.ok) throw new Error("No response from server");
            return response.json();
        })
        .then(json => {
            json.output.forEach(item => {
                output[item.stateID] = {
                    'state': item.state
                };
            });
        })
        .catch(err => {
            console.log("Error getting requests states: " + err);
        });

    return output;
}

function getCPUs() {
    const output = {};

    fetch("/api/hostings/cpu")
        .then(response => {
            if (!response.ok) throw new Error("No response from server");
            return response.json();
        })
        .then (json => {
            json.output.forEach(item => {
                output[item.cpuID] = {
                    'cpuName': item.cpuName,
                    'frequency': item.frequency,
                    'cores': item.cores,
                    'threads': item.threads,
                    'cacheL3': item.cacheL3,
                    'cacheL2': item.cacheL2,
                    'cacheL1': item.cacheL1,
                };
            })
        })
        .catch(err => {
            console.log("Error getting CPUs list: " + err)
        });

    return output;
}

function getPermissions() {
    const output = {};

    fetch("/api/requests/get-permissions")
        .then(response => {
            if (!response.ok) throw new Error("No response from server");
            return response.json();
        })
        .then (json => {
            json.output.forEach(item => {
                output[item.permissionID] = {
                    'permission': item.permission,
                };
            })
        })
        .catch(err => {
            console.log("Error getting hostings list: " + err)
        });

    return output;
}

function fillFilter() {
    try {
        filter_select.innerHTML = `<option value="0">Все</option>`;

        for (let i = 1; i <= Object.keys(states).length - 1; i++) {
            const state_name = states[i].state;
            if (state_name == undefined) throw new Error("Status name in undefined");

            filter_select.innerHTML += `<option value="${i}">${state_name}</option>`;
        }
    } catch(err) {
        console.log("Error filling filter: " + err)
        if (filter_retries <= max_retries) {
            filter_retries += 1;
            fillFilter();
        }
    }
}

function filterRequests(filter) {
    buildRequests(filter);
}
