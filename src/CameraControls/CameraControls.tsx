import React, {
  FC,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  Ref,
  useImperativeHandle,
  Fragment,
  useMemo
} from 'react';
import { useThree, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import {
  ControlsContext,
  ControlsContextProps,
  useControls
} from './useControls';
import { useHotkeys } from 'reakeys';
import * as holdEvent from 'hold-event';

// Install the camera controls
CameraControls.install({ THREE });

// Extend r3f with the new controls
extend({ CameraControls });

const KEY_CODES = {
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40
};

const leftKey = new holdEvent.KeyboardKeyHold(KEY_CODES.ARROW_LEFT, 100);
const rightKey = new holdEvent.KeyboardKeyHold(KEY_CODES.ARROW_RIGHT, 100);
const upKey = new holdEvent.KeyboardKeyHold(KEY_CODES.ARROW_UP, 100);
const downKey = new holdEvent.KeyboardKeyHold(KEY_CODES.ARROW_DOWN, 100);

export type CameraMode = 'pan' | 'rotate';

export interface ControlsProps {
  mode?: CameraMode;
  children?: React.ReactNode;
  animated?: boolean;
}

export type ControlsRef = ControlsContextProps;

export const Controls: FC<ControlsProps & { ref?: Ref<ControlsRef> }> =
  forwardRef(({ mode, children, animated }, ref: Ref<ControlsRef>) => {
    const { controls } = useControls();
    const cameraRef = useRef<CameraControls | null>(null);
    const { camera, gl, invalidate } = useThree();

    useFrame((_state, delta) => cameraRef.current?.update(delta));
    useEffect(() => () => cameraRef.current?.dispose(), []);

    const zoomIn = useCallback(() => {
      cameraRef.current?.zoom(camera.zoom / 2, animated);
      invalidate();
    }, [animated, camera.zoom, invalidate]);

    const zoomOut = useCallback(() => {
      cameraRef.current?.zoom(-camera.zoom / 2, animated);
      invalidate();
    }, [animated, camera.zoom, invalidate]);

    const panRight = useCallback(
      event => {
        cameraRef.current?.truck(-0.03 * event.deltaTime, 0, animated);
        invalidate();
      },
      [animated, invalidate]
    );

    const panLeft = useCallback(
      event => {
        cameraRef.current?.truck(0.03 * event.deltaTime, 0, animated);
        invalidate();
      },
      [animated, invalidate]
    );

    const panUp = useCallback(
      event => {
        cameraRef.current?.truck(0, 0.03 * event.deltaTime, animated);
        invalidate();
      },
      [animated, invalidate]
    );

    const panDown = useCallback(
      event => {
        cameraRef.current?.truck(0, -0.03 * event.deltaTime, animated);
        invalidate();
      },
      [animated, invalidate]
    );

    const onKeyDown = useCallback(
      event => {
        if (event.code === 'Space') {
          if (mode === 'rotate') {
            cameraRef.current.mouseButtons.left = CameraControls.ACTION.TRUCK;
          } else {
            cameraRef.current.mouseButtons.left = CameraControls.ACTION.ROTATE;
          }
        }
      },
      [mode]
    );

    const onKeyUp = useCallback(
      event => {
        if (event.code === 'Space') {
          if (mode === 'rotate') {
            cameraRef.current.mouseButtons.left = CameraControls.ACTION.ROTATE;
          } else {
            cameraRef.current.mouseButtons.left = CameraControls.ACTION.TRUCK;
          }
        }
      },
      [mode]
    );

    useEffect(() => {
      leftKey.addEventListener('holding', panLeft);
      rightKey.addEventListener('holding', panRight);
      upKey.addEventListener('holding', panUp);
      downKey.addEventListener('holding', panDown);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      return () => {
        leftKey.removeEventListener('holding', panLeft);
        rightKey.removeEventListener('holding', panRight);
        upKey.removeEventListener('holding', panUp);
        downKey.removeEventListener('holding', panDown);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }, [onKeyDown, onKeyUp, panDown, panLeft, panRight, panUp]);

    useEffect(() => {
      const ref = cameraRef.current;
      if (!ref) {
        ref.addEventListener('update', invalidate);
        ref.addEventListener('control', invalidate);
        // ref.current.addEventListener('zoomIn', zoomIn);
        // ref.current.addEventListener('zoomOut', zoomOut);
      }

      return () => {
        if (controls) {
          ref.removeEventListener('update', invalidate);
          ref.removeEventListener('control', invalidate);
          // controls.removeEventListener('zoomIn', zoomIn);
          // controls.removeEventListener('zoomOut', zoomOut);
        }
      };
    }, [cameraRef, invalidate, controls, zoomIn, zoomOut]);

    useEffect(() => {
      if (mode === 'rotate') {
        cameraRef.current.mouseButtons.left = CameraControls.ACTION.ROTATE;
      } else {
        cameraRef.current.mouseButtons.left = CameraControls.ACTION.TRUCK;
      }
    }, [mode]);

    useHotkeys([
      {
        name: 'Zoom In',
        keys: 'command+shift+i',
        callback: event => {
          event.preventDefault();
          zoomIn();
        }
      },
      {
        name: 'Zoom Out',
        keys: 'command+shift+o',
        callback: event => {
          event.preventDefault();
          zoomOut();
        }
      }
    ]);

    const values = useMemo(
      () => ({
        controls: cameraRef.current,
        zoomIn: () => zoomIn(),
        zoomOut: () => zoomOut(),
        panLeft: () => panLeft({ deltaTime: 1 }),
        panRight: () => panRight({ deltaTime: 1 }),
        panDown: () => panDown({ deltaTime: 1 }),
        panUp: () => panUp({ deltaTime: 1 })
      }),
      // eslint-disable-next-line
      [zoomIn, zoomOut, panLeft, panRight, panDown, panUp, cameraRef.current]
    );

    useImperativeHandle(ref, () => values);

    return (
      <ControlsContext.Provider value={values}>
        <cameraControls ref={cameraRef} args={[camera, gl.domElement]} />
        {children}
      </ControlsContext.Provider>
    );
  });

Controls.defaultProps = {
  mode: 'rotate'
};