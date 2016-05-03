import assert from 'assert'
import { asyncAction } from '../src/actions'
import { createReducer, modelArrayHandler } from '../src/reducers'

describe( 'actions', function() {

  describe( 'asyncAction', function() {

    it( 'capitalises the name', function() {
      let func = asyncAction( 'test_name', () => {} );
      assert.deepEqual( func.types, {
        REQUEST: 'TEST_NAME_REQUEST',
        SUCCESS: 'TEST_NAME_SUCCESS',
        FAILURE: 'TEST_NAME_FAILURE'
      })
    });

    it( 'creates types', function() {
      let func = asyncAction( 'TEST_NAME', () => {} );
      assert.deepEqual( func.types, {
        REQUEST: 'TEST_NAME_REQUEST',
        SUCCESS: 'TEST_NAME_SUCCESS',
        FAILURE: 'TEST_NAME_FAILURE'
      })
    });

    it( 'creates action creator', function() {
      let func = asyncAction( 'TEST_NAME', () => {} );
      assert.equal( typeof func(), 'function' );
    });

    describe( 'created action', function() {

      it( 'calls dispatch with request', function( done ) {
        let actionCreator = asyncAction( 'test_name', () => {} );
        actionCreator()( action => {
          assert.equal( action.type, actionCreator.types.REQUEST );
          done();
        });
      });

      it( 'calls provided action', function( done ) {
        let actionCreator = asyncAction( 'test_name', () => {
          assert( true );
          done();
        });
        actionCreator()( action => {} );
      });

      it( 'returns result of provided action', function() {
        let actionCreator = asyncAction( 'test_name', () => {
          return 'hello';
        });
        assert.equal( actionCreator()( action => {} ), 'hello' );
      });
    });
  });
});

describe( 'reducers', function() {

  describe( 'createReducer', function() {

    it( 'accepts no handlers', function() {
      let root = createReducer();
      assert.notEqual( root, undefined );
    });
  });

  describe( 'modelArrayHandler', function() {
    const array = [
      { id: 10, val: 100 },
      { id: 20, val: 200 },
      { id: 30, val: 300 }
    ];
    const reducer = createReducer( modelArrayHandler({ init: 'INIT_TYPE', update: 'UPDATE_TYPE' }, ( x, y ) => x ) );

    it( 'stores array under `objects`', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      assert.deepEqual( state.objects, array );
    });

    it( 'creates mapping', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      assert.deepEqual( state.map, { 10: 0, 20: 1, 30: 2 } );
    });

    it( 'keeps mapping after passing to sub-reducer', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      state = reducer( state, { type: 'GOTO_SUB' } );
      assert.deepEqual( state.map, { 10: 0, 20: 1, 30: 2 } );
    });

    it( 'gets objects', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      assert.deepEqual( state.get( 20 ), { id: 20, val: 200 } );
      assert.deepEqual( state.get( 10 ), { id: 10, val: 100 } );
    });

    it( 'adds new object', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      state = reducer( state, { type: 'UPDATE_TYPE', results: { id: 40, val: 400 } });
      assert.deepEqual( state, {
        objects: [
          { id: 10, val: 100 },
          { id: 20, val: 200 },
          { id: 30, val: 300 },
          { id: 40, val: 400 }
        ],
        map: {
          10: 0,
          20: 1,
          30: 2,
          40: 3
        }
      });
    });

    it( 'adds array of new objects', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      state = reducer( state, { type: 'UPDATE_TYPE', results: [
        { id: 50, val: 500 },
        { id: 40, val: 400 },
      ]});
      assert.deepEqual( state, {
        objects: [
          { id: 10, val: 100 },
          { id: 20, val: 200 },
          { id: 30, val: 300 },
          { id: 50, val: 500 },
          { id: 40, val: 400 },
        ],
        map: {
          10: 0,
          20: 1,
          30: 2,
          50: 3,
          40: 4,
        }
      });
    });

    it( 'updates exsting object', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      state = reducer( state, { type: 'UPDATE_TYPE', results: { id: 20, val: 600 } });
      assert.deepEqual( state, {
        objects: [
          { id: 10, val: 100 },
          { id: 20, val: 600 },
          { id: 30, val: 300 },
        ],
        map: {
          10: 0,
          20: 1,
          30: 2
        }
      });
    });

    it( 'updates array of exsting objects', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      state = reducer( state, { type: 'UPDATE_TYPE', results: [
        { id: 20, val: 600 },
        { id: 10, val: 700 },
      ]});
      assert.deepEqual( state, {
        objects: [
          { id: 10, val: 700 },
          { id: 20, val: 600 },
          { id: 30, val: 300 },
        ],
        map: {
          10: 0,
          20: 1,
          30: 2
        }
      });
    });

    it( 'adds and updates objects', function() {
      let state = reducer( [], { type: 'INIT_TYPE', results: array } );
      state = reducer( state, { type: 'UPDATE_TYPE', results: [
        { id: 50, val: 500 },
        { id: 20, val: 600 },
        { id: 10, val: 700 },
        { id: 40, val: 400 },
      ]});
      assert.deepEqual( state, {
        objects: [
          { id: 10, val: 700 },
          { id: 20, val: 600 },
          { id: 30, val: 300 },
          { id: 50, val: 500 },
          { id: 40, val: 400 },
        ],
        map: {
          10: 0,
          20: 1,
          30: 2,
          40: 4,
          50: 3,
        }
      });
    });
  });
});
