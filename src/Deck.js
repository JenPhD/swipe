import React, { Component } from 'react';
import {
  View,
  Animated,
  PanResponder,
  //Dimensions used to get the width or height of device screen
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native';

//Retrieves the screen size
const SCREEN_WIDTH = Dimensions.get('window').width;
//Determines how far to be swiped to be considered liked or disliked
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
//Sets timing of swipe
const SWIPE_OUT_DURATION = 250;



class Deck extends Component {
  //if onSwipeRight has no value it is assigned to empty function
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {}
  };

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
        if (gesture.dx > SWIPE_THRESHOLD) {
          //forces the card off the screen
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      }
    });
    //Can also do this without state so you don't mutate it
    //this.position = position;
    //But, this is the way the docs read
    this.state = { panResponder, position, index: 0 };
  }
  //comparing the current set of props with
  //the next set of props
  componentWillReceiveProps(nextProps) {
    if(nextProps.data !== this.props.data) {
      this.setState({ index: 0 })
    }
  }

  //As the card swipes and component updates
  //adds spring animation to the new render
  componentWillUpdate() {
    //For Android
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  forceSwipe(direction) {
    //passing in right or left to change animation with swipe direction
    //ternary expression, returns true, then go right, if not left
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    //More linear than spring, passing duration for animation
    Animated.timing(this.state.position, {
      //Since x is equal to SCREEN_WIDTH OR -SCREEN-WIDTH
      //you can refactor from x: x to just x
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
      //callback function to start action after card has been swiped
    }).start(() => this.onSwipeComplete(direction));
  }

  onSwipeComplete (direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const item = data[this.state.index];
    //ternary
    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    //reset the position of the next card
    this.state.position.setValue({ x: 0, y: 0 });
    //re-setting the value of state and moving to next indexed card
    //++ will not work because you don't want to mutate state
    this.setState({ index: this.state.index + 1 });
  }

  //reset position to original animated position
  resetPosition() {
    //"Spring" into position
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
    //if there are no more cards left to swipe
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data.map((item, i) => {
      if(i < this.state.index) { return null; }
      //i is keeping track of the count on index of the card
      //this.state.index is the value of the index
      // in the current piece of state
      if( i === this.state.index ) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getCardStyle(), styles.cardStyle]}
            {...this.state.panResponder.panHandlers}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }

      // cards pushed 10 * the number it is away from
      //becoming the top card in the stack (i-this.state.index)
      //to make it appear like a cascading stack
      return (
        <Animated.View
          key={item.id}
          style={[styles.cardStyle, { top: 10 * (i - this.state.index) }]}
        >
          {this.props.renderCard(item)}
        </Animated.View>
      );
      //reverses the rendering order so item 1
      // appears on top of stack
    }).reverse();
  }

  render() {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH
  }
};

export default Deck;