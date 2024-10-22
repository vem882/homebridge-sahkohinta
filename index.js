const axios = require('axios');
const { API } = require('homebridge');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-sahkohinta', 'SahkoHinta', SahkoHintaAccessory);
};

class SahkoHintaAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.apiURL = config.apiURL || 'https://www.sahkohinta-api.fi/api/v1/halpa';
    this.updateInterval = config.updateInterval || 3600000; // 1 hour
    this.tunnit = config.tunnit || 1; // Default 1 hour data
    this.priceService = new Service.TemperatureSensor(this.name);

    this.priceService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getPrice.bind(this));

    this.price = 0;
    this.startPolling();
  }

  startPolling() {
    this.getPrice();
    setInterval(() => {
      this.getPrice();
    }, this.updateInterval);
  }

  async getPrice(callback) {
    try {
      const response = await axios.get(this.apiURL, {
        params: {
          tunnit: this.tunnit,
          tulos: 'haja', // Fetch individual hours
        },
      });

      const latestPrice = parseFloat(response.data[0].hinta); // Get the latest price
      this.price = latestPrice;
      this.log(`Latest electricity price: ${this.price} snt/kWh`);

      if (callback) callback(null, this.price);
    } catch (error) {
      this.log('Error fetching electricity price:', error);
      if (callback) callback(error);
    }
  }

  getServices() {
    return [this.priceService];
  }
}
