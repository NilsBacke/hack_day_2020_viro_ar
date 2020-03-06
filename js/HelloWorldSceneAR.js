'use strict';

import React, { Component } from 'react';

import { StyleSheet, Platform } from 'react-native';

import {
  ViroARScene,
  ViroText,
  ViroConstants,
  ViroFlexView,
  ViroImage,
  ViroSpinner
} from 'react-viro';

// const CURRENT_LOCATION = '34.434480,-119.863910'
const CURRENT_LOCATION = '34.434043,-119.863005'

export default class HelloWorldSceneAR extends Component {

  constructor() {
    super();

    // Set initial state here
    this.state = {
      text : "Initializing AR...",
      point1X: 0,
      point1Z: 0,
      point2X: 0,
      point2Z: 0,
      point3X: 0,
      point3Z: 0,
      hasARInitialized: false,
      properties: []
    };

    // bind 'this' to functions
    this.onARInitialized = this.onARInitialized.bind(this);
    this._latLongToMerc = this._latLongToMerc.bind(this);
    this._transformPointToAR = this._transformPointToAR.bind(this);
  }

  componentDidMount() {
    this.getPropertyCoordinates()
  }

  getPropertyCoordinates() {
    fetch(`https://73364d2a.ngrok.io/dashboard/get_ar_attrs?lat_long=${CURRENT_LOCATION}`)
      .then((response) => {
        console.log(response)
        return response.json()
      })
      .then((responseJson) => {
        console.log(responseJson)
        this.setState({
          properties: responseJson.properties
        }, () => {
          this.onARInitialized();
        })
      })
      .catch((error) => {
        console.error(error);
      });

    // this.setState({
    //   properties: [
    //     {
    //       addr: { address1: "TEST ADDRESS" },
    //       t_lat: 34.434850,
    //       t_long: -119.863801,
    //     },
    //     {
    //       addr: { address1: "TEST ADDRESS" },
    //       t_lat: 34.434585,
    //       t_long: -119.863801,
    //     },
    //     {
    //       addr: { address1: "TEST ADDRESS" },
    //       t_lat: 34.434585,
    //       t_long: -119.863801,
    //     },
    //   ]
    // })
  }

  onTrackingUpdated = (state, reason) => {
    if (!this.state.hasARInitialized && state === ViroConstants.TRACKING_NORMAL) {
      this.setState(
        {
          hasARInitialized: true,
        },
        () => {
          this.onARInitialized();
        }
      );
    }
  };

  onARInitialized() {
    if (this.state.properties[0]) {
      var point1 = this._transformPointToAR(this.state.properties[0].addr.latitude, this.state.properties[0].addr.longitude);
      var point2 = this._transformPointToAR(this.state.properties[1].addr.latitude, this.state.properties[1].addr.longitude);
      var point3 = this._transformPointToAR(this.state.properties[2].addr.latitude, this.state.properties[2].addr.longitude);
      console.log("obj north final x:" + point1.x + "final z:" + point1.z);
      console.log("obj east point x" + point2.x + "final z" + point2.z);
      console.log("obj west point x" + point3.x + "final z" + point3.z);
      this.setState({
        point1X: point1.x,
        point1Z: point1.z,
        point2X: point2.x,
        point2Z: point2.z,
        point3X: point3.x,
        point3Z: point3.z,
        text : "AR Init called."
      });
    }
    
  }

 _latLongToMerc(lat_deg, lon_deg) {
   var lon_rad = (lon_deg / 180.0 * Math.PI)
   var lat_rad = (lat_deg / 180.0 * Math.PI)
   var sm_a = 6378137.0
   var xmeters  = sm_a * lon_rad
   var ymeters = sm_a * Math.log((Math.sin(lat_rad) + 1) / Math.cos(lat_rad))
   return ({ x:xmeters, y:ymeters });
  }

  _transformPointToAR(lat, long) {
    const deviceObjPoint = this._latLongToMerc(lat, long); // see previous post for code.
    const mobilePoint = this._latLongToMerc(Number(CURRENT_LOCATION.split(',')[0]), Number(CURRENT_LOCATION.split(',')[1])); // see previous post for code.

    const objDeltaY = deviceObjPoint.y - mobilePoint.y;
    const objDeltaX = deviceObjPoint.x - mobilePoint.x;

    if (Platform.OS === "android") {
      let degree = 90; // not using real compass yet.
      let angleRadian = (degree * Math.PI) / 180;

      let newObjX = objDeltaX * Math.cos(angleRadian) - objDeltaY * Math.sin(angleRadian);
      let newObjY = objDeltaX * Math.sin(angleRadian) + objDeltaY * Math.cos(angleRadian);

      return { x: newObjX, z: -newObjY };
    }

    return { x: objDeltaX, z: -objDeltaY };
  }

  renderPropertyCard(index) {
    const property = this.state.properties[index];
    return (<ViroFlexView style={{flexDirection: 'column', backgroundColor: 'white', alignItems: 'flex-start' }} 
        width={6} height={6}
        scale={[5, 5, 5]}
        position={[this.state[`point${index + 1}X`], 0, this.state[`point${index + 1}Z`]]}
        transformBehaviors={["billboard"]}>
      <ViroImage source={{ uri: property.photo_url || 'https://ddr.properties/wp-content/uploads/2015/02/placeholder.jpg' }} height={3} width={6} />
      <ViroFlexView style={{flexDirection: 'column', backgroundColor: 'white', alignItems: 'flex-start', padding: 0.1 }} height={3} width={6}>
        <ViroText text={`Property: ${property.addr.address1}`} style={styles.helloWorldTextStyle} width={5} />
        <ViroText text={`Market Rent: ${property.market_rent}`} style={styles.helloWorldTextStyle} width={5} />
        <ViroText text={`Available on: ${`not soon enough!`}`} style={styles.helloWorldTextStyle} width={5} />
      </ViroFlexView>
    </ViroFlexView>)
  }

  render() {
    if (!this.state.properties[0]) {
      return <ViroARScene dragType='FixedToWorld' onTrackingUpdated={this.onTrackingUpdated}>
        <ViroSpinner
          position={[0, 0, -2]}
        />
      </ViroARScene>
    }
    return (
      <ViroARScene dragType='FixedToWorld' onTrackingUpdated={this.onTrackingUpdated}>
        {this.renderPropertyCard(0)}
        {this.renderPropertyCard(1)}
        {this.renderPropertyCard(2)}
      </ViroARScene>
    );
  }
}

var styles = StyleSheet.create({
  helloWorldTextStyle: {
    fontSize: 28,
    fontFamily: 'Arial',
    color: '#000000',
    textAlignVertical: 'center',
  },
});

module.exports = HelloWorldSceneAR;
