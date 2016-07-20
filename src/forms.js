export function createSubmit( action ) {
  function submit( values, dispatch ) {
    return new Promise( ( resolve, reject ) => {
      action( values )
          .then( response => resolve() )
          .fail( response => {
            const { __all__, ...errors } = response.responseJSON || {};
            reject({
              _error: __all__,
              ...errors
            });
          })
    });
  }
  return submit;
}
