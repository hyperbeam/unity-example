using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Serialization;

namespace DefaultNamespace
{
    public class Interactable : MonoBehaviour
    {
        public UnityEvent onInteract;
        public string interactionInfo;

        public void Interact()
        {
            Debug.Log("Invoking onInteract...");
            onInteract?.Invoke();
        }
    }
}