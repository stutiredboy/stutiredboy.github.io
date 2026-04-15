import random

def shuffle( value ):
    """ Jinja template filter for shuffling list/tuple """
    if not isinstance( value, list
            ) and not isinstance( value, tuple ):
        return value
    random.shuffle( value )
    return value
