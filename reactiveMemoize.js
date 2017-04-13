import { Tracker } from 'meteor/tracker';

import ReactiveMap from './ReactiveMap';

// Note: This function should only be called a constant number of times, not dependent on a user's
// actions. (i.e. don't call it directly from a template helper, call it from a helper that saves
// the result of this function).
export default function reactiveMemoize(fn) {
  // Create a map from arguments -> result
  const map = new ReactiveMap();

  // Wrap the given function to add memoization
  return function reactiveMemoizeWrapper(...args) {

    // Stringify the arguments to use as a key
    const argString = JSON.stringify(args);

    // If we haven't computed a value for these arguments, compute it now
    if (!map.hasKey(argString)) {

      // Normally, if you call autorun from within another autorun, the child
      // autorun is stopped when the parent is invalidated (so you don't leak
      // autoruns). In this case, though, we want to keep this running even
      // if it's nested in another autorun, so we use Tracker.nonreactive to
      // break out of our current context.
      Tracker.nonreactive(() => {

        // Set up an autorun to recompute the result of the function when its
        // dependencies change.
        Tracker.autorun(computation => {

          // Check that we still have dependents -- if not, nobody cares about
          // the result and we can clean up this autorun.
          if (map.getDep(argString).hasDependents() || computation.firstRun) {

            // Compute the result and cache it
            map.set(argString, fn.apply(this, args));

          } else {

            // Nobody cares about this result anymore; clean up the autorun
            computation.stop();
            map.remove(argString);

          }
        });
      });
    }

    return map.get(argString);
  };
}
