// Высчитывание прокрутки слайдера
function checkScroll(direction) {
    switch (direction) {
        case "left":
            if (!(currentSlide <= 0)) {
                currentSlide -= 1;
            }
            break;
        case "right":
            if (!(currentSlide >= slidesCount - 1)) {
                currentSlide += 1;
            }
            break;
        case "to-the-beginning":
            currentSlide = 0;
            break;
    }

    prevButton.disabled = false;
    nextButton.disabled = false;

    if (currentSlide <= 0) {
        prevButton.disabled = true;
    }

    if (currentSlide >= slidesCount - 1) {
        nextButton.disabled = true;
    }
}

function getCPU() {
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

// Сборка слайдера
function buildSlider() {
    slider.innerHTML = "";

    fetch("/api/hostings")
        .then(response => {
            if (!response) throw new Error("No response from server");
            return response.json();
        })
        .then(json => {
            let i = 0;

            json.output.forEach(item => {
                const cpu = cpus[item.cpuID].cpuName;

                const ram = item.ram < 1048576 ? item.ram / 1024 : item.ram / 1048576;
                const ramDigit = item.ram < 1048576 ? "ГБ" : "ТБ";

                const ramUser = item.ramUser < 1048576 ? item.ramUser / 1024 : item.ramUser / 1048576;
                const ramUserDigit = item.ramUser < 1048576 ? "ГБ" : "ТБ";

                const diskSpace = item.diskSpace < 1048576 ? item.diskSpace / 1024 : item.diskSpace / 1048576;
                const diskSpaceDigit = item.diskSpace < 1048576 ? "ГБ" : "ТБ";

                const diskSpaceUser = item.diskSpaceUser < 1048576 ? item.diskSpaceUser / 1024 : item.diskSpaceUser / 1048576;
                const diskSpaceUserDigit = item.diskSpaceUser < 1048576 ? "ГБ" : "ТБ";

                slider.innerHTML += `
                <div class='hosting-wrap'>
                    <div class='hosting'>
                        <h2>${item.hostingAlias}</h2>
                        <p>Процессор: ${cpu}</p>
                        <p>Оперативная память: ${ram} ${ramDigit}</p>
                        <p>Пользовательский объём: ${ramUser} ${ramUserDigit}</p>
                        <p>Объём диска: ${diskSpace} ${diskSpaceDigit}</p>
                        <p>Пользовательский объём: ${diskSpaceUser} ${diskSpaceUserDigit}</p>
                    </div>
                </div>
                `;

                i += 1;
            });

            slidesCount = i;
        })
        .then(() => {
            slideWidth = document.querySelectorAll(".hosting")[0].clientWidth;
        })
        .then(() => {
            checkScroll("still");
        })
        .catch(err => {
            console.error('Failed getting slider content: ', err);
            if (retries < max_retries) {
                retries += 1;
                buildSlider();
            }
        });
}





const slider = document.querySelector('.hostings-slider');
const prevButton = document.querySelector('.hostings-slider-controls .prev-button');
const nextButton = document.querySelector('.hostings-slider-controls .next-button');

const cpus = getCPU();

let slideWidth = 840;

let slidesCount = 0;
let currentSlide = 0;

let retries = 0;
const max_retries = 3;


buildSlider();


prevButton.addEventListener('click', () => {
    slider.scrollBy({
        left: -slideWidth,
    });
    checkScroll("left");
});


nextButton.addEventListener('click', () => {
    slider.scrollBy({
        left: slideWidth,
    });
    checkScroll("right");
});

