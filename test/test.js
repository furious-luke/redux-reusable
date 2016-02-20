import assert from 'assert'
import { asyncAction } from '../src/actions'

describe( 'actions', function() {

    describe( 'asyncAction', function() {

        it( 'capitalises the name', function() {
            let func = asyncAction( 'test_name', () => {} );
            assert.deepEqual( func.TEST_NAME, {
                REQUEST: 'TEST_NAME_REQUEST',
                SUCCESS: 'TEST_NAME_SUCCESS',
                FAILURE: 'TEST_NAME_FAILURE'
            })
        });

        it( 'creates types', function() {
            let func = asyncAction( 'TEST_NAME', () => {} );
            assert.deepEqual( func.TEST_NAME, {
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
                    assert.equal( action.type, actionCreator.TEST_NAME.REQUEST );
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
