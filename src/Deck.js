import React, { Component } from 'react';
import {
  View,
  Animated,
  PanResponder,
  //Dimensions used to get the width or height of device screen
  Dimensions
} from 'react-native';

//Retrieves the screen size
const SCREEN_WIDTH = Dimensions.get('window').width;

class Deck extends Component {
  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      //Starts with user touch
      onStartShouldSetPanResponder: () => true,
      //Moving with finger
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      //What to do when user releases finger
      onPanResponderRelease: (event, gesture) => {
        this.resetPosition();
      }
    });
    //Can also do this without state so you don't mutate it
    //this.position = position;
    //But, this is the way the docs read
    this.state = { panResponder, position };
  }

  //reset position to original animated position
  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  }

  getCardStyle() {
    const { position } = this.state;
    //interpolation: mapping the rotation(output)
    // to dragging the finger(input)
    const rotate = position.x.interpolate({
      //Interpolating with device screen width

      //This is hard coding the interpolation
      //Not the best for multiple sized devices
      //inputRange: [-500, 0, 500],
      //outputRange: ['-120deg', '0deg', '120deg']

      //This uses screen width from negative to positive
      //*1.5 increases scale, takes more distance to rotate
      //and decreases rotation
      //If you want to have a fast rotation use smaller numbers and hard code
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    });

    //layout is the item x,y position
    return {
      ...position.getLayout(),
      //transform alters the action
      transform: [{ rotate }]
    };
  }

  renderCards() {
    return this.props.data.map((item, index) => {
      if( index === 0 ) {
        return (
          <Animated.View
            key={item.id}
            style={this.getCardStyle()}
            {...this.state.panResponder.panHandlers}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }
      return this.props.renderCard(item);
    });
  }

  render() {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }
}

export default Deck;