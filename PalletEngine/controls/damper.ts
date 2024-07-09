/**
 * The Damper class is a generic second-order critically damped system that does
 * one linear step of the desired length of time. The only parameter is
 * DECAY_MILLISECONDS. This common parameter makes all states converge at the
 * same rate regardless of scale. xNormalization is a number to provide the
 * rough scale of x, such that NIL_SPEED clamping also happens at roughly the
 * same convergence for all states.
 */

const DECAY_MILLISECONDS : number = 50;
const MIN_DECAY_MILLISECONDS : number = 0.001;

export default class Damper {
    velocity : number;
    naturalFrequency : number;

  constructor(decayMilliseconds : number = DECAY_MILLISECONDS ) {
    this.velocity = 0;
    this.naturalFrequency = 0;
    this.setDecayTime(decayMilliseconds);
  }
  setDecayTime( decayMilliseconds : number ) {
    this.naturalFrequency =
      1 / Math.max(MIN_DECAY_MILLISECONDS, decayMilliseconds);
  }
  update( x : number , xGoal : number , timeStepMilliseconds : number , xNormalization : number ) {
    
    const nilSpeed : number = 0.0002 * this.naturalFrequency;
    if ( x == null || xNormalization === 0 ) {
      return xGoal;
    }

    if ( x === xGoal && this.velocity === 0 ) {
      return xGoal;
    }

    if ( timeStepMilliseconds < 0 ) {
      return x;
    }
    // Exact solution to a critically damped second-order system, where:
    // acceleration = this.naturalFrequency * this.naturalFrequency * (xGoal - x) - 2 * this.naturalFrequency * this.velocity;
    const deltaX = ( x - xGoal );
    const intermediateVelocity = this.velocity + this.naturalFrequency * deltaX;
    const intermediateX = deltaX + timeStepMilliseconds * intermediateVelocity;
    const decay = Math.exp(-this.naturalFrequency * timeStepMilliseconds);
    const newVelocity = (intermediateVelocity - this.naturalFrequency * intermediateX) * decay;
    const acceleration = -this.naturalFrequency * (newVelocity + intermediateVelocity * decay);
    if ( Math.abs( newVelocity ) < nilSpeed * Math.abs( xNormalization ) && ( acceleration * deltaX ) >= 0 ) {
      // This ensures the controls settle and stop calling this function instead of asymptotically approaching their goal.
      this.velocity = 0;
      return xGoal;
    } else {
      this.velocity = newVelocity;
      return xGoal + intermediateX * decay;
    }
  }
  estimateTime( x : number , xGoal : number , delta : number , threshold : number = 0 ) {
    // async to calculate;
    // return frame unit;
    let frames = 0;
    let sx = x;
    while( sx < xGoal - threshold || sx > xGoal + threshold ) {
      sx = this.update( sx, xGoal, delta, 0.01 );
      ++frames;
    }
    return frames;
  }
}
