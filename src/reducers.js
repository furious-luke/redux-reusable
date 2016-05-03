import { combineReducers } from 'redux'
import { union } from './sets'

// Check for handlers that have overlapping keys.
// TODO: Throw a more useful error.
function checkOverlappingHandlers( handlers ) {
  if( handlers.length ) {
    let all = new Set( Object.keys( handlers[0] ) );
    let count = all.size;
    for( var ii = 1; ii < handlers.length; ++ii ) {
      let cur = Object.keys( handlers[ii] );
      all = union( all, cur );
      count += cur.length;
    }
    if( all.length != count )
      throw 'Overlapping handlers.';
  }
}

// Take a set of handlers and an initial state and produce
// a function to call an appropriate handler from a standard
// reducer call, i.e. ( state, action ).
export function createReducer( handlers, initialState = {} ) {

  // Before checking for overlap in the handlers, extract any subreducers.
  let subreducers;
  if( Array.isArray( handlers ) ) {
    let count = 0;
    subreducers = {};
    handlers.forEach( handler => {
      let cur = handler.SUBREDUCERS;
      if( cur ) {
        count += Object.keys( cur ).length;
        subreducers = { ...subreducers, ...cur };
      }
    });
    if( Object.keys( subreducers ).length != count )
      throw 'Overlapping subreducers.';
    if( count == 0 )
      subreducers = undefined;
  }
  else if( handlers !== undefined )
    subreducers = handlers.SUBREDUCERS;
  else
    subreducers = undefined;

  // Handlers can be an array, indicating we want to merge a bunch of
  // handlers together.
  let allHandlers;
  if( Array.isArray( handlers ) ) {
    checkOverlappingHandlers( handlers );
    allHandlers = Object.assign.apply( {}, handlers );
  }
  else
    allHandlers = handlers;

  return function reducer( state = initialState, action ) {

    // Check for a local action.
    // ASSUMPTION: Actions may appear only once in any tree.
    if( action && allHandlers.hasOwnProperty( action.type ) )
      return allHandlers[action.type]( state, action );

    // Check for subreducers.
    else if( subreducers ) {
      let subState = {};
      Object.keys( subreducers ).forEach( key => {
        subState[key] = subreducers[key]( state[key], action );
      });
      return Object.assign( {}, state, subState );
    }

    // Check for a default action.
    else if( allHandlers.hasOwnProperty( 'DEFAULT' ) )
      return allHandlers.DEFAULT( state, action );

    else
      return state;
  }
}

// Create an array reducer.
export function createArrayReducer( handlers, initialState = [] ) {
  return createReducer( handlers, initialState );
}

// Take an array of objects and return a mapping from a uniquely
// identified field to the objects.
export function toObjectMap( state, key = 'id' ) {
  if( Array.isArray( state ) ) {
    let byId = {};
    state.forEach( item => byId[item[key]] = item );
    return byId;
  }
  else
    return state;
}

// Similar to `toObjectMap`, but instead of mapping to the objects,
// map to the indices of the objects in the original array.
export function toIndexMap( state, key = 'id' ) {
  if( Array.isArray( state ) ) {
    let byId = {};
    state.forEach( ( item, ii ) => byId[item[key]] = ii );
    return byId;
  }
  else
    return state;
}

// A handler that applies `toObjectMap` on incoming arrays,
export function objectListHandler( itemReducer, { actionKey = 'id', itemKey = 'id' }) {
  return {

    DEFAULT( state = {}, action ) {
      if( action &&
        action.hasOwnProperty( actionKey ) &&
        state.hasOwnProperty( action[actionKey] ) )
      {
        return {
          ...state,
          [ itemKey ]: itemReducer( state[action[actionKey]], action )
        };
      }
      else
        return toObjectList( state, itemKey );
    }
  }
}

// A handler that extracts elements from arrays.
export function arrayHandler( itemReducer, indexKey = 'index' ) {
  return {

    DEFAULT( state = [], action ) {
      if( action &&
        action.hasOwnProperty( indexKey ) &&
        (action[indexKey] >= 0 && action[indexKey] < state.length) )
      {
        let index = action[indexKey];
        return [
          ...state.slice( 0, index ),
          itemReducer( state[index], action ),
          ...state.slice( index + 1 )
        ]
      }
      else
        return state;
    }
  };
}

// Manages an array of objects each of which has a unique identifier.
// Tracks the objects in an object with an array and a mapping.
export function modelArrayHandler( types, modelReducer, indexKey = 'index', idKey = 'id' ) {
  const arrayReducer = createArrayReducer( arrayHandler( modelReducer, indexKey ) );
  if( types.init === undefined )
    throw 'Must supply at least an initialise type.';
  let handler = {

    [ types.init ]( state = [], action ) {
      let obj = {
        objects: action.results,
        map: toIndexMap( action.results, idKey )
      };
      let get = function( id ) { return this.objects[this.map[id]]; }
      get.bind( obj );
      obj.get = get;
      return obj;
    },

    DEFAULT( state = {}, action ) {
      return {
        ...state,
        objects: arrayReducer( state, action )
      };
    }
  };
  if( types.update ) {

    handler[types.update] = function( state = {}, action ) {
      const { objects = [], map = {} } = state || {};

      // Ensure we have an array of objects to add.
      let results = action.results;
      if( !Array.isArray( action.results ) )
        results = [ action.results ];

      // Create duplicates of the incoming state.
      let newObjects = [ ...objects ], newMap = { ...map };

      // Add each object.
      results.forEach( newObj => {
        const id = newObj.id;
        if( id === undefined )
          throw 'Cannot update a model array with no ID.';

        let index = newMap[id];
        if( index === undefined )
          index = newObjects.length;

        newObjects[index] = modelReducer( newObj, action );
        newMap[id] = index;
      });

      return {
        objects: newObjects,
        map: newMap
      };
    }
  }
  return handler;
}

// A handler for async actions.
export function asyncHandler( key, actionTypes, reducer ) {
  let handlers = {

    [ actionTypes.REQUEST ]( state, action ) {
      return {
        ...state,
        [ key + 'Loading' ]: true
      };
    },

    [ actionTypes.SUCCESS ]( state, action ) {
      return {
        ...state,
        [ key ]: (reducer ? reducer : ( x, y ) => y.results)( state[key], action ),
        [ key + 'Error' ]: undefined,
        [ key + 'Loading' ]: false
      };
    },

    [ actionTypes.FAILURE ]( state, action ) {
      return {
        ...state,
        [ key ]: (reducer ? reducer : ( x, y ) => x)( state[key], action ),
        [ key + 'Error' ]: action.error,
        [ key + 'Loading' ]: false
      };
    }
  };
  if( reducer ) {
    handlers.SUBREDUCERS = {
      [ key ]: reducer
    }
  }
  return handlers;
}

// Do I even need this guy anymore?
export function oneInListReducer( state, action ) {
  let current = new Set( state );
  let all = new Set( action.options );
  let newList = [ ...current ].filter( x => all.has( x ) );
  newList.push( action.selected );
  return newList;
}
