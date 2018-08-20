// Data
import Devices from '../data/devices';
import Rates from '../data/rates';
import MaxPower from '../data/max-power';

// Models
import Period from './models/period.model';

class Main {
  constructor() {
    this.devices = Devices.devices;
    this.rates = Rates.rates;
    this.maxPower = MaxPower.maxPower;

    this.dailySchedule = [];
    this.maxDayHour = 23;

    this.createFullDay();
    this.fillSchedule();
  }

  /**
   * Получить расписание в виде массива id приборов.
   *
   * @returns {Array}
   */
  get schedule() {
    let scheduleList = [];
    this.dailySchedule.map((period, i) => {
      const deviceId = period.devices.map((device) => device.id);
      scheduleList[i] = [...deviceId];
    });

    console.log(scheduleList);
    return scheduleList;
  }

  /**
   * Создать массив с ячейками расписания
   */
  createFullDay() {
    this.rates.map((rate) => {
      const isNight = (rate.from > rate.to);
      const maxHours = 23;
      const totalNightHours = maxHours - (rate.from - rate.to);

      const inputData = {
        tick: (isNight) ? 0 : rate.from,
        period: rate,
        totalTicks: (isNight) ? totalNightHours : rate.to
      };

      this.createDayRange(inputData);
    });
  }

  /**
   * Создать период по часам.
   *
   * @param inputData
   */
  createDayRange(inputData) {
    let currentHour = inputData.period.from;

    while (inputData.tick <= inputData.totalTicks) {
      if (currentHour > this.maxDayHour) {
        currentHour = 0;
      }

      this.dailySchedule[currentHour] = {
        value: inputData.period.value,
        mode: (inputData.period.from >= this.maxDayHour) ? 'night' : 'day',
        devices: [],
        totalPower: 0
      };

      currentHour++;
      inputData.tick++;
    }
  }

  /**
   * Получить список релевантых периодов для дейвайса.
   *
   * @param device
   * @returns {*}
   */
  getRelevantPeriod(device) {
    return (device.mode)
      ? this.dailySchedule.filter((period) => period.mode === device.mode)
      : this.dailySchedule;
  }

  /**
   * Заполнить расписание приборами.
   */
  fillSchedule() {
    this.devices.map((device) => {
      const periods = this.getRelevantPeriod(device);
      const deviceStages = this.createPairs(periods, device);

      this.addDevice(deviceStages, device);
    });
  }

  /**
   * Создание значений "прибор – период".
   *
   * @param stages
   * @param device
   * @returns {*}
   */
  createPairs(stages, device) {
    let optimalPeriod = new Period();

    if (device.duration === stages.length) {
      return stages;
    } else {
      for (let i = 0; i < stages.length; i++) {
        const times = this.createPossiblePeriods(stages, i, device);
        optimalPeriod = this.comparePeriods(times, optimalPeriod);
      }
      return optimalPeriod.data;
    }
  }

  /**
   * Сравнить два периода.
   *
   * @param times
   * @param optimalPeriod
   * @returns {*}
   */
  comparePeriods(times, optimalPeriod) {
    if (optimalPeriod.total === 0) {
      optimalPeriod = times;
    } else if (times.total !== 0 && times.total < optimalPeriod.total) {
      optimalPeriod = times;
    }

    return optimalPeriod;
  }

  /**
   * Создать все возможные периоды для устройства.
   *
   * @param stages
   * @param i
   * @param device
   * @returns {Period}
   */
  createPossiblePeriods(stages, i, device) {
    if (!stages[i + device.duration]) return new Period();

    const period = new Period();
    const devicePeriod = stages[i + device.duration];
    const totalPeriodPower = devicePeriod.totalPower + device.power;

    if (totalPeriodPower < this.maxPower) {
      for (let j = 0; j < device.duration; j++) {
        period.total += stages[i + j].value;
        period.data.push(stages[i + j]);
      }
    }

    return period;
  }

  /**
   * Добавить прибор в список расписания.
   *
   * @param period
   * @param device
   */
  addDevice(period, device) {
    period.map((period) => {
      period.totalPower += device.power;
      period.devices.push(device);
    });
  }

}

new Main();