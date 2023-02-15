using Hyperbeam;
using System;
using System.Collections;
using System.Collections.Generic;
using DefaultNamespace;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;

public class FirstPersonController : MonoBehaviour
{
    [SerializeField]
    public GameObject PlayerCam;
    public GameObject BrowserImage;
    
    public CharacterController CharacterController;
    public PlayerInput playerControl;
    public HyperbeamController hb;

    public Transform groundCheck;
    public float groundDistance = 0.4f;
    public LayerMask groundMask;
    public float mouseSensitivity = 20;
    public float movementSpeed = 5;
    public float gravity = -9.81f;

    public float interactionDistance = 0.5f;
    public Transform interactionCenter;
    public WritablePanel interactionPrompt;

    private float xRotation = 0f;
    private Vector2 inputVec = Vector2.zero;
    private Vector3 _velocity;
    private bool _isGrounded;
    private bool _isUIOpen;
    private Collider[] _interactables = new Collider[1];
    private Interactable _currentInteractable = null;

    // Start is called before the first frame update
    void Start()
    {
        if (CharacterController == null)
        {
            CharacterController = gameObject.GetComponent<CharacterController>();
        }

        playerControl = gameObject.GetComponent<PlayerInput>();
        hb.OnControlReturned.AddListener(ControlReturned);
    }


    public void ControlReturned()
    {
        Cursor.lockState = CursorLockMode.Locked;
        playerControl.SwitchCurrentActionMap("Player");
        BrowserImage.SetActive(false);
        _isUIOpen = false;
    }

    // Update is called once per frame
    void Update()
    {
        var moveVec = Vector3.zero;
        
        _isGrounded = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);

        if (inputVec != Vector2.zero)
        {
            moveVec = transform.right * inputVec.x + transform.forward * inputVec.y; 
        }
        
        if (_isGrounded && _velocity.y < 0)
        {
            _velocity.y = -1f;
        }
        else
        {
            _velocity.y += gravity * Time.deltaTime;
        }
        
        CharacterController.Move(((moveVec * movementSpeed) + _velocity)  * Time.deltaTime);
    }

    private void checkForInteractables()
    {
        _interactables[0] = null;
        Physics.OverlapSphereNonAlloc(interactionCenter.position, interactionDistance, _interactables, LayerMask.GetMask("Interactable"));
    }
    
    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(interactionCenter.position, interactionDistance);
    }

    public void OnInteract()
    {
        Debug.Log("On Interact called");
        if (_currentInteractable != null)
        {
            Debug.Log($"Attempting to interact with: {_currentInteractable.gameObject}");
            _currentInteractable.Interact();
            interactionPrompt.gameObject.SetActive(false);
        }
    }

    public void OnMove(InputAction.CallbackContext ctx)
    {
        inputVec = ctx.ReadValue<Vector2>();
        checkForInteractables();

        if (_interactables[0] != null)
        {
            var interactable = _interactables[0].GetComponent<Interactable>();
            interactionPrompt.gameObject.SetActive(true);
            interactionPrompt.SetPrompt(interactable.interactionInfo);
            _currentInteractable = interactable;
        }
        else
        {
            interactionPrompt.gameObject.SetActive(false);
        }
    }

    public void OnLook(InputAction.CallbackContext ctx)
    {
        if (Cursor.lockState != CursorLockMode.Locked)
            return;

        var lookInput = ctx.ReadValue<Vector2>();
        xRotation -= lookInput.y * mouseSensitivity * Time.deltaTime;
        xRotation = Mathf.Clamp(xRotation, -80f, 90f);
        PlayerCam.transform.localRotation = Quaternion.Euler(xRotation, 0f, 0f);
        gameObject.transform.Rotate(Vector3.up, lookInput.x * mouseSensitivity * Time.deltaTime);
    }

    public void OnFire()
    {
        Cursor.lockState = CursorLockMode.Locked;
    }

    public void OnReleaseLock() 
    {
        Cursor.lockState = CursorLockMode.None;
    }

    public void OnOpenUI()
    {
        if (hb.Instance == null) return;
        if (_isUIOpen) return;
        Cursor.lockState = CursorLockMode.None;
        playerControl.SwitchCurrentActionMap("UI");
        BrowserImage.SetActive(true);
        hb.PassControlToBrowser("q", false, false, true, false);
        _isUIOpen = true;
    }
}
