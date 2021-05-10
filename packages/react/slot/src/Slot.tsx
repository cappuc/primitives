import * as React from 'react';
import { composeRefs } from '@radix-ui/react-compose-refs';

/* -------------------------------------------------------------------------------------------------
 * Slot
 * -----------------------------------------------------------------------------------------------*/

type SlotProps = { children: React.ReactNode };

const Slot = React.forwardRef<HTMLElement, SlotProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const childLength = React.Children.count(children);

  if (childLength === 1) {
    return (
      <SlotClone {...slotProps} ref={forwardedRef}>
        {children}
      </SlotClone>
    );
  }

  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === Slottable) {
          return (
            <SlotClone {...slotProps} ref={forwardedRef}>
              {child.props.children}
            </SlotClone>
          );
        }

        return child;
      })}
    </>
  );
});

Slot.displayName = 'Slot';

/* -------------------------------------------------------------------------------------------------
 * SlotClone
 * -----------------------------------------------------------------------------------------------*/

type SlotCloneProps = { children: React.ReactNode };

const SlotClone = React.forwardRef<any, SlotCloneProps>((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const child = React.Children.only(children);

  return React.isValidElement(child)
    ? React.cloneElement(child, {
        ...mergeProps(slotProps, child.props),
        ref: composeRefs(forwardedRef, (child as any).ref),
      })
    : null;
});

SlotClone.displayName = 'SlotClone';

/* -------------------------------------------------------------------------------------------------
 * Slottable
 * -----------------------------------------------------------------------------------------------*/

const Slottable = ({ children }: { children: React.ReactNode }) => {
  return children as React.ReactElement;
};

/* ---------------------------------------------------------------------------------------------- */

type AnyProps = Record<string, any>;

function mergeProps(slotProps: AnyProps, childProps: AnyProps) {
  // all child props should override
  const overrideProps = { ...childProps };

  // if it's a handler, modify the override by composing the base handler
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);

    if (isHandler) {
      overrideProps[propName] = composeHandlers(childPropValue, slotPropValue);
    }
  }

  return { ...slotProps, ...overrideProps };
}

function composeHandlers(
  originalEventHandler?: (...args: unknown[]) => unknown,
  ourEventHandler?: (...args: unknown[]) => unknown,
  { checkForDefaultPrevented = true } = {}
) {
  return function (...args: unknown[]) {
    originalEventHandler?.(...args);

    if (checkForDefaultPrevented && isEvent(args[0]) && args[0].defaultPrevented) {
      return;
    }

    return ourEventHandler?.(...args);
  };
}

function isEvent(value: unknown): value is Event {
  return value != null && typeof value === 'object' && value instanceof Event;
}

const Root = Slot;

export {
  Slot,
  Slottable,
  //
  Root,
};
