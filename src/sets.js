export function union( aa, bb ) {
    // TODO: Check efficiency.
    return new Set([ ...aa, ...bb ]);
}

export function intersection( aa, bb ) {
    // TODO: Check efficiency.
    bb = new Set( bb );
    return new Set([ ...aa ].filter( x => bb.has( x ) ));
}

export function difference( aa, bb ) {
    // TODO: Check efficiency.
    bb = new Set( bb );
    return new Set([ ...aa ].filter( x => !bb.has( x ) ));
}
