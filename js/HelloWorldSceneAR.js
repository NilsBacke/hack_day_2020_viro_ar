'use strict';

import React, { Component } from 'react';

import {StyleSheet, Platform} from 'react-native';

import {
  ViroARScene,
  ViroText,
  ViroConstants,
  ViroARPlane,
  ViroBox,
  ViroAmbientLight,
  ViroDirectionalLight
} from 'react-viro';

// const CURRENT_LOCATION = '34.434480,-119.863910'
const CURRENT_LOCATION = '34.434561,-119.863801'

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
    fetch(`https://4861dddf.ngrok.io/dashboard/get_ar_attrs?lat_long=${CURRENT_LOCATION}`)
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
      var point1 = this._transformPointToAR(this.state.properties[0].t_lat, this.state.properties[0].t_long);
      var point2 = this._transformPointToAR(this.state.properties[1].t_lat, this.state.properties[1].t_long);
      var point3 = this._transformPointToAR(this.state.properties[2].t_lat, this.state.properties[2].t_long);
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
      }, () => {
        console.log(this.state)
      });
    }
    
  }

 _latLongToMerc(lat_deg, lon_deg) {
   var lon_rad = (lon_deg / 180.0 * Math.PI)
   var lat_rad = (lat_deg / 180.0 * Math.PI)
   var sm_a = 6378137.0
   var xmeters  = sm_a * lon_rad
   var ymeters = sm_a * Math.log((Math.sin(lat_rad) + 1) / Math.cos(lat_rad))
   return ({x:xmeters, y:ymeters});
  }

  _transformPointToAR(lat, long) {
    const deviceObjPoint = this._latLongToMerc(lat, long); // see previous post for code.
    const mobilePoint = this._latLongToMerc(Number(CURRENT_LOCATION.split(',')[0]), Number(CURRENT_LOCATION.split(',')[1])); // see previous post for code.

    const objDeltaY = deviceObjPoint.y - mobilePoint.y;
    const objDeltaX = deviceObjPoint.x - mobilePoint.x;

    if (Platform.OS === "android") {
      let degree = 90; // not using real compass yet.
      let angleRadian = (degree * Math.PI) / 180;

      console.log('Using degree => ', degree);
      console.log('Angle radian => ', angleRadian);

      let newObjX = objDeltaX * Math.cos(angleRadian) - objDeltaY * Math.sin(angleRadian);
      let newObjY = objDeltaX * Math.sin(angleRadian) + objDeltaY * Math.cos(angleRadian);

      console.log('old delta => ', { x: objDeltaX, z: -objDeltaY });
      console.log('new delta => ', { x: newObjX, z: -newObjY });

      return { x: newObjX, z: -newObjY };
    }

    return { x: objDeltaX, z: -objDeltaY };
  }

  render() {
    if (!this.state.properties[0]) {
      return <ViroARScene dragType='FixedToWorld' onTrackingUpdated={this.onTrackingUpdated} />
    }
    return (
      <ViroARScene dragType='FixedToWorld' onTrackingUpdated={this.onTrackingUpdated}>
        <ViroText text={this.state.properties[0].addr.address1} scale={[3, 3, 3]} transformBehaviors={["billboard"]} position={[this.state.point1X, 0, this.state.point1Z]} style={styles.helloWorldTextStyle} />
        <ViroText text={this.state.properties[2].addr.address1} scale={[3, 3, 3]} transformBehaviors={["billboard"]} position={[this.state.point3X, 0, this.state.point3Z]} style={styles.helloWorldTextStyle} />
        <ViroText text={this.state.properties[1].addr.address1} scale={[3, 3, 3]} transformBehaviors={["billboard"]} position={[this.state.point2X, 0, this.state.point2Z]} style={styles.helloWorldTextStyle} />
      </ViroARScene>
    );
  }
}

var styles = StyleSheet.create({
  helloWorldTextStyle: {
    fontFamily: 'Arial',
    fontSize: 30,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',  
  },
});

module.exports = HelloWorldSceneAR;
