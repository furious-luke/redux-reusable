// Create an action dispatcher for an async call.
export function asyncAction( name, action, opts = {} ) {
    let { requestArgs = {}, successArgs = {}, failureArgs = {} } = opts;
    let nameCaps = name.toUpperCase();

    let types = {
        REQUEST: nameCaps + '_REQUEST',
        SUCCESS: nameCaps + '_SUCCESS',
        FAILURE: nameCaps + '_FAILURE'
    }

    function actionFunc() {
        return ( dispatch, getState ) => {
            dispatch({
                type: types.REQUEST,
                ...requestArgs
            });
            return action(
                dispatch,
                getState,
                results => dispatch({
                    type: types.SUCCESS,
                    results,
                    ...successArgs
                }),
                error => dispatch({
                    type: types.FAILURE,
                    error,
                    ...failureArgs
                })
            );
        }
    }

    actionFunc[nameCaps] = types;
    return actionFunc;
}

// Call an action for dispatch but also prevent the default action.
export function handle( action, ...args ) {
    return event => {
        event.preventDefault();
        action( ...args );
    }
}

// Found an issue with the default `bindActionCreators`. It seems that
// there is some fishy object-method binding.
export function bindActionCreators( actionCreators, dispatch ) {
    let actions = {};
    Object.keys( actionCreators ).forEach(
        ( key ) => actions[key] = ( ...args ) => dispatch( actionCreators[key]( ...args ) )
    );
    return actions;
}
