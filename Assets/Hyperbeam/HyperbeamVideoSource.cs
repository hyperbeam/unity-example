using UnityEngine;

namespace Hyperbeam
{
    /// <summary>
    /// This is an example class that shows the basic method of waiting until a texture is available and setting the material texture to itt.
    /// <para>
    ///     It  is advisable to set a default texture on the material and give it an Unlit shader, or the stream will look washed out.
    /// </para>
    /// </summary>
    public class HyperbeamVideoSource : MonoBehaviour
    {
        public HyperbeamController controller;

        private void Start()
        {
            controller.OnTextureReady += OnTextureReady;
        }

        private void OnTextureReady(Texture2D texture)
        {
            GetComponent<Renderer>().material.mainTexture = texture;
        }
    }
}
